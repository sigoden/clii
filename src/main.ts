#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve as pathResolve, dirname } from "path";
import { createRequire } from "module";
import fs from "fs/promises";
import { parse as parseAst } from "@babel/parser";
import {
  Comment,
  Declaration,
  Identifier,
  ObjectProperty,
  VariableDeclaration,
} from "@babel/types";
import { parse as parseBlockComment } from "comment-parser";

let rawArgv = hideBin(process.argv);

async function main() {
  const defaultArgv = yargs(rawArgv).parseSync();
  const script = await loadScript(defaultArgv);
  patchRawArgv();
  let app = yargs(rawArgv)
    .usage("Usage: $0 <cmd> [options]")
    .help()
    .alias("h", "help")
    .parserConfiguration({
      "parse-numbers": false,
      "parse-positional-numbers": false,
    })
    .option("file", {
      alias: "f",
      type: "string",
      description: "Specific cmru file",
    })
    .option("workdir", {
      alias: "w",
      type: "string",
      description: "Specific working directory",
    })
    .option("verbose", {
      type: "boolean",
      describe: "Echo command",
    })
    .option("silent", {
      type: "boolean",
      describe: "Suppress all normal output",
    })
    .conflicts("verbose", "silent")
    .implies("workdir", "file");
  for (const { name, meta } of script.settings) {
    app = app.option(name, meta as any);
  }
  for (const receipt of script.receipts) {
    let cmd = `${receipt.name}`;
    let cmdWithOptions = false;
    for (const param of receipt.params) {
      if (param.props?.length > 0) {
        cmdWithOptions = true;
      } else {
        const [b, e] = param.optional ? ["[", "]"] : ["<", ">"];
        if (param.meta.array) {
          cmd += ` ${b}${param.name}...${e}`;
        } else {
          cmd += ` ${b}${param.name}${e}`;
        }
      }
    }
    if (cmdWithOptions) cmd += " [options]";
    app = app.command(
      script.defaultCmd ? [cmd, "<$0>"] : cmd,
      receipt.description,
      (yargs: yargs.Argv<any>) => {
        for (const param of receipt.params) {
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
      async (argv) => {
        try {
          patchArgv(argv);
          script.updateSettings(argv);
          const args = receipt.params.map((param) => {
            if (param.props?.length > 0) {
              return param.props.reduce((acc, item) => {
                acc[item.name] = argv[item.name];
                return acc;
              }, {} as any);
            } else {
              return argv[param.name];
            }
          });
          await receipt.fn(...args);
        } catch (err) {
          console.error(err);
          process.exit(1);
        }
      }
    );
  }
  if (script.error) {
    console.log(await app.getHelp());
    console.log("\n" + script.error);
  } else {
    app = app.demandCommand().strictCommands();
  }
  app.argv;
}

main();

interface Script {
  receipts: Receipt[];
  settings: ScriptSetting[];
  updateSettings?: (argv: Record<string, any>) => void;
  defaultCmd?: boolean;
  error?: any;
}

interface Receipt {
  name: string;
  description: string;
  params: ReceiptParam[];
  fn: ReceiptFn;
}

interface ReceiptFn {
  (...args: any[]): Promise<void>;
}

interface ReceiptParam {
  name: string;
  optional: boolean;
  props?: ReceiptParam[];
  meta: {
    description: string;
    type: string;
    array?: boolean;
    choices?: any[];
  };
}

interface ScriptSetting {
  name: string;
  meta: {
    description: string;
    default: any;
    type: string;
  };
}

async function loadScript(argv: Record<string, any>): Promise<Script> {
  const receipts: Receipt[] = [];
  const settings: ScriptSetting[] = [];
  let defaultCmd = false;
  try {
    const { file, workdir } = await findScript(argv);
    process.chdir(workdir);
    const __filename = pathResolve(file);
    const __dirname = dirname(__filename);
    const require = createRequire(file);
    Object.assign(global, { __filename, __dirname, require });
    const source = await fs.readFile(file, "utf-8");
    const moduleExports = await import(file);
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
        if (name === "default") defaultCmd = true;
        receipts.push({
          name,
          description,
          params,
          fn: moduleExports[name],
        });
      } else {
        if (name === "settings") {
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
                settings.push({
                  name: key,
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
    return {
      defaultCmd,
      settings: settings,
      updateSettings: (argv: Record<string, any>) => {
        for (const { name } of settings) {
          if (typeof argv[name] !== "undefined") {
            moduleExports["settings"][name] = argv[name];
          }
        }
      },
      receipts,
    };
  } catch (err) {
    return {
      receipts,
      settings: settings,
      error: err,
    };
  }
}

async function findScript(argv: Record<string, any>) {
  const argFile: string = argv.file || argv.f;
  const checkFiles = [];
  if (argFile) {
    checkFiles.push(pathResolve(argFile));
  } else {
    let dir = process.cwd();
    while (true) {
      checkFiles.push(pathResolve(dir, "cmrufile.mjs"));
      checkFiles.push(pathResolve(dir, "Cmrufile.mjs"));
      const parentDir = dirname(dir);
      if (parentDir === dir) {
        break;
      }
      dir = parentDir;
    }
  }
  let file: string;
  for (const checkFile of checkFiles) {
    try {
      const stat = await fs.stat(checkFile);
      if (stat.isFile()) {
        file = checkFile;
        break;
      }
    } catch {}
  }
  if (!file) {
    throw new Error("Not found script");
  }
  let workdir: string = argv.workdir || argv.w;
  if (!workdir) {
    workdir = dirname(file);
  } else {
    workdir = pathResolve(workdir);
  }
  return { file, workdir };
}

function parseComment(comment: Comment) {
  const params: ReceiptParam[] = [];
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
      const param: ReceiptParam = {
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

const patchArgMark = "`";

function patchRawArgv() {
  rawArgv = rawArgv.map((arg) => {
    if (arg.startsWith("-") && arg.match(/\s/)) {
      arg = `${patchArgMark}${arg}${patchArgMark}`;
    }
    return arg;
  });
}

function patchArgv(argv: Record<string, any>) {
  Object.keys(argv).forEach((name) => {
    const argValue = argv[name];
    const isPatched = (value: string) =>
      typeof value === "string" &&
      value.startsWith(patchArgMark) &&
      value.endsWith(patchArgMark);
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
