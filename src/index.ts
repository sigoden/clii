import yargs, { Arguments, ArgumentsCamelCase } from "yargs";
import { hideBin } from "yargs/helpers";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { parse as parseAst } from "@babel/parser";
import { resolve, dirname } from "path";
import { createRequire } from "module";
import {
  Comment,
  Declaration,
  Identifier,
  ObjectProperty,
  VariableDeclaration,
} from "@babel/types";
import { parse as parseBlockComment } from "comment-parser";

const PATCH_ARGV_SYMBOL = "`";
const GLOBAL_OPTIONS_KEY = "settings";

/**
 * Mount clii on esm file.
 * @param url - Url of esm file, e.g. `import.meta.url`
 * @param exportArgv - Wether exports parsed argv to global
 * @returns
 */
export default async function (url: string, exportArgv = true) {
  const file = fileURLToPath(url);
  if (file !== process.argv[1]) return;
  polyfillESM(file);
  const rawArgv = patchRawArgv(hideBin(process.argv));
  let app = yargs(rawArgv)
    .usage("Usage: $0 <cmd> [options]")
    .help()
    .alias("h", "help");
  const fatal = (err: any) => {
    console.log(err);
    process.exit(1);
  };
  try {
    const moduleExports = await import(file);
    const yargsData = await parse(file, moduleExports);
    app = buildYargs(app, yargsData, async (command, argv) => {
      try {
        revertPatchedArgv(argv);
        updateGlobalOptions(yargsData, argv, moduleExports);
        const params =
          command.params.length > 0
            ? getCommandParams(command, argv)
            : argv._.slice(1);
        if (exportArgv) global.argv = argv;
        await moduleExports[command.name](...params);
      } catch (err) {
        fatal(err);
      }
    });
  } catch (err) {
    fatal(err);
  }
  app.argv;
}

export function buildYargs<T = any>(
  app: yargs.Argv<T>,
  yargsData: YargsData,
  handle: (
    command: Subcommand,
    argv: ArgumentsCamelCase<T>
  ) => void | Promise<void>
) {
  for (const { name, meta } of yargsData.options) {
    app = app.option(name, meta as any);
  }
  if (yargsData.commands.length > 0) {
    app = app.demandCommand();
  }
  for (const command of yargsData.commands) {
    let commandName = command.name;
    let hasOptions = false;
    for (const param of command.params) {
      if (param.props?.length > 0) {
        hasOptions = true;
      } else {
        const [b, e] = param.optional ? ["[", "]"] : ["<", ">"];
        if (param.meta.array) {
          commandName += ` ${b}${param.name}...${e}`;
        } else {
          commandName += ` ${b}${param.name}${e}`;
        }
      }
    }
    if (hasOptions) commandName += " [options]";
    app = app.command(
      yargsData.hasDefault ? [commandName, "<$0>"] : commandName,
      command.description,
      (yargs: yargs.Argv<T>) => {
        for (const param of command.params) {
          if (param.props?.length > 0) {
            for (const { name, meta: option } of param.props) {
              yargs = yargs.option(name, option as any);
            }
          } else {
            yargs.positional(param.name, param.meta as any);
          }
        }
        return yargs;
      },
      (argv) => handle(command, argv)
    );
  }
  return app;
}

export interface YargsData {
  commands: Subcommand[];
  options: YargsOption[];
  hasDefault?: boolean;
  error?: any;
}

export interface Subcommand {
  name: string;
  description: string;
  params: YargsOption[];
}

export interface YargsOption {
  name: string;
  optional: boolean;
  props?: YargsOption[];
  meta: {
    description: string;
    type: string;
    default?: any;
    array?: boolean;
    choices?: any[];
  };
}

/**
 * Parse script file
 * @param file - Source mjs file
 * @param moduleExports - Source file exports
 * @returns
 */
export async function parse(
  file: string,
  moduleExports: any
): Promise<YargsData> {
  const commands: Subcommand[] = [];
  const options: YargsOption[] = [];
  const result: YargsData = { commands, options, hasDefault: false };
  try {
    const source = await fs.readFile(file, "utf-8");
    const ast = parseAst(source, {
      sourceType: "module",
    });
    for (const statement of ast.program.body) {
      const { leadingComments } = statement;
      if (
        statement.type !== "ExportNamedDeclaration" &&
        statement.type !== "ExportDefaultDeclaration"
      )
        continue;
      const declaration = statement.declaration as Declaration;
      let name = parseExportName(declaration);
      if (!name) {
        if (statement.type === "ExportDefaultDeclaration") {
          name = "default";
        } else {
          continue;
        }
      }
      const exportItem = moduleExports[name];
      if (typeof exportItem === "function") {
        const comment = leadingComments
          ? leadingComments[leadingComments.length - 1]
          : null;
        const { description, params } = parseComment(comment);
        if (name === "default") result.hasDefault = true;
        commands.push({
          name,
          description,
          params,
        });
      } else {
        if (name === GLOBAL_OPTIONS_KEY) {
          const declaration2 = (declaration as VariableDeclaration)
            .declarations[0];
          if (declaration2.init.type === "ObjectExpression") {
            const props = declaration2.init.properties.filter(
              (v) => v.type === "ObjectProperty" && v.key.type === "Identifier"
            ) as ObjectProperty[];
            for (const item of props) {
              const description = item.leadingComments
                ? item.leadingComments[
                    item.leadingComments.length - 1
                  ].value.trim()
                : "";
              const key = (item.key as Identifier).name;
              const value = exportItem[key];
              let type: string;
              if (["string", "boolean", "number"].indexOf(typeof value) > -1) {
                type = typeof value;
              } else if (Array.isArray(value)) {
                type = "array";
              }
              if (type) {
                options.push({
                  name: key,
                  optional: true,
                  meta: {
                    description,
                    default: value,
                    type,
                  },
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    result.error = error;
  }
  if (options.length > 0) {
  }
  return result;
}

function parseComment(comment: Comment) {
  const params: YargsOption[] = [];
  const result = { description: "", params };
  if (!comment) return result;
  const block = parseBlockComment(`/*${comment.value}*/`)[0];
  if (comment.type === "CommentLine") {
    result.description = comment.value.trim();
  } else if (comment.type === "CommentBlock") {
    result.description = block.description.split("\n")[0].trim();
    for (const spec of block.tags) {
      if (spec.tag !== "param") continue;
      const paramType = parseParamType(spec.type);
      if (!paramType) continue;
      const { name, description, optional } = spec;
      const type: string = paramType.type;
      const param: YargsOption = {
        name,
        optional,
        meta: {
          type,
          array: paramType.array === true,
          choices: paramType.choices,
          description: description.replace(/^(\s*)?-(\s*)?/, ""),
        },
      };
      const parts = name.split(".");
      if (parts.length === 1) {
        if (type === "object") param.props = [];
        params.push(param);
      } else if (parts.length === 2) {
        const [parent, localName] = parts;
        const parentParam = params.find(
          (x) => x.name === parent && Array.isArray(x.props)
        );
        if (parentParam) {
          param.name = localName;
          parentParam.props.push(param);
        }
      }
    }
  }
  return result;
}

function parseExportName(declaration: Declaration): string {
  let name = "";
  if (declaration.type === "FunctionDeclaration") {
    if (declaration.id) {
      name = declaration.id.name;
    }
  } else if (declaration.type === "VariableDeclaration") {
    const declaration2 = declaration.declarations[0];
    if (declaration2.type === "VariableDeclarator") {
      name = (declaration2.id as any).name || "";
    }
  }
  return name;
}

interface ParseParamTypeResult {
  type: string;
  array?: boolean;
  choices?: any[];
}

function parseParamType(type: string): ParseParamTypeResult {
  type = type.trim();
  if (type.endsWith("[]")) {
    const baseType = parseBaseType(type.slice(0, -2));
    if (!baseType) return null;
    return {
      type: baseType as any,
      array: true,
    };
  }
  const baseType = parseBaseType(type);
  if (baseType) return { type: baseType };
  if (/^\(.*\)$/.test(type)) {
    const segements = type
      .slice(1, -1)
      .split("|")
      .map((v) => {
        if (/^"(.*)"$/.test(v)) {
          return v.slice(1, -1);
        }
        if (/^'(.*)'$/.test(v)) {
          return v.slice(1, -1);
        }
        try {
          return JSON.parse(v);
        } catch {}
      });
    const firstTyp = typeof segements[0];
    if (firstTyp === "number" || firstTyp === "string") {
      if (segements.every((x) => typeof x === firstTyp)) {
        return {
          type: firstTyp,
          choices: segements,
        };
      }
    }
  }
  return null;
}

function parseBaseType(type: string) {
  switch (type) {
    case "object":
    case "Object":
      return "object";
    case "string":
    case "number":
    case "boolean":
      return type;
    default:
  }
}

/**
 * Patch raw argv
 *
 * Yargs parsed ["--foo v1"] to {"foo": "v1"}, We patch it to [`"-- foo v1"`] to prevent that behavior
 * @param rawArgv - Comes from process.argv
 * @returns
 */
export function patchRawArgv(rawArgv: string[]) {
  return rawArgv.map((arg) => {
    if (/^(-)+(\w+)\s+/.test(arg.trim())) {
      arg = `${PATCH_ARGV_SYMBOL}${arg}${PATCH_ARGV_SYMBOL}`;
    }
    return arg;
  });
}

/**
 * Revert argv value that we patched with `
 * @param argv - Parsed argv object
 */
export function revertPatchedArgv(argv: Record<string, any>) {
  Object.keys(argv).forEach((name) => {
    const argValue = argv[name];
    const isPatched = (value: string) =>
      typeof value === "string" &&
      value.startsWith(PATCH_ARGV_SYMBOL) &&
      value.endsWith(PATCH_ARGV_SYMBOL);
    if (typeof argValue === "string") {
      if (isPatched(argValue)) {
        argv[name] = argValue.slice(1, -1);
      }
    } else if (Array.isArray(argValue)) {
      argv[name] = argValue.map((value) => {
        if (isPatched(value)) {
          return value.slice(1, -1);
        }
        return value;
      });
    }
  });
}

/**
 * Add `__filename` and `__dirname`, `require` to esm modules.
 */
export function polyfillESM(file: string) {
  const __filename = resolve(file);
  const __dirname = dirname(__filename);
  const require = createRequire(file);
  Object.assign(global, { __filename, __dirname, require });
}

/**
 * Update global options
 */
export function updateGlobalOptions(
  yargsData: YargsData,
  argv: Arguments,
  moduleExports: any
) {
  const globalOptions = moduleExports[GLOBAL_OPTIONS_KEY];
  if (typeof globalOptions !== "object") return;
  for (const { name } of yargsData.options) {
    if (typeof argv[name] !== "undefined") {
      globalOptions[name] = argv[name];
    }
  }
}

/**
 * Parse comand params
 */
export function getCommandParams(command: Subcommand, argv: Arguments) {
  return command.params.map((param) => {
    if (param.props?.length > 0) {
      return param.props.reduce((acc, item) => {
        acc[item.name] = argv[item.name];
        return acc;
      }, {} as any);
    } else {
      return argv[param.name];
    }
  });
}
