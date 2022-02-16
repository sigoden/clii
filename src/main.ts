#!/usr/bin/env node

import yargs from "yargs";
import { resolve as pathResolve, dirname } from "path";
import { createRequire } from "module";
import { hideBin } from "yargs/helpers";
import { parse as parseAst } from "@babel/parser";
import { parse as parseComment } from "comment-parser";
import { readFile, stat as fileStat } from "fs/promises";
import { registerGlobals, vars, $, cd } from "./index";

const hideBinArgv = hideBin(process.argv);

const DEFAULT_FILE = "cmru.js";

async function main() {
  registerGlobals();
  const defaultArgv = yargs(hideBinArgv).parseSync();
  const script = await loadScript(defaultArgv);
  if (
    script.defaultCmd &&
    !defaultArgv._[0] &&
    !defaultArgv.h &&
    !defaultArgv.help
  ) {
    hideBinArgv.push("default");
  }
  let app = yargs(hideBinArgv)
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
      default: DEFAULT_FILE,
      description: "Specific cmru file",
    })
    .option("workdir", {
      alias: "w",
      type: "string",
      description: "Specific working directory",
    })
    .option("quiet", {
      type: "boolean",
      description: "Don't echo command",
    })
    .implies("workdir", "file");
  for (const [key, { value, description }] of vars.entries()) {
    let type: "array" | "number" | "string" | "boolean";
    if (Array.isArray(value)) {
      type = "array";
    } else if (typeof value === "number") {
      type = "number";
    } else if (typeof value === "boolean") {
      type = "boolean";
    } else {
      type = "string";
    }
    app = app.option(key, {
      type,
      default: value,
      description,
    });
  }
  for (const receipt of script.receipts) {
    let cmd = `${receipt.name}`;
    for (const param of receipt.params) {
      const [b, e] = param.optional ? ["[", "]"] : ["<", ">"];
      if (param.type.endsWith("[]")) {
        cmd += ` ${b}${param.name}...${e}`;
      } else {
        cmd += ` ${b}${param.name}${e}`;
      }
    }
    app = app.command(
      cmd,
      receipt.description,
      (yargs) => {
        for (const param of receipt.params) {
          if (param.description) {
            yargs.positional(param.name, {
              description: param.description,
            });
          }
        }
        return yargs;
      },
      async (argv) => {
        try {
          $.verbose = !argv["quiet"];
          for (const [key, { value, description }] of vars.entries()) {
            vars.set(key, { description, value: argv[key] || value });
          }
          const args = receipt.params.map((param) => argv[param.name]);
          await receipt.fn(...args);
        } catch (err) {
          console.log(err);
        }
      }
    );
  }
  if (script.error) {
    console.log(await app.getHelp());
    console.log("\n" + script.error);
  } else {
    app = app.demandCommand();
  }
  app.argv;
}

main();

interface Script {
  receipts: Receipt[];
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
  description: string;
  type: string;
  optional: boolean;
}

async function loadScript(argv: Record<string, any>): Promise<Script> {
  const receipts: Receipt[] = [];
  let defaultCmd = false;
  try {
    const { file, workdir } = await findScript(argv);
    cd(workdir);
    const source = await readFile(file, "utf-8");
    const modules = await import(file);
    const __filename = pathResolve(file);
    const __dirname = dirname(__filename);
    const require = createRequire(file);
    Object.assign(global, { __filename, __dirname, require, argv });
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
      let name: string;
      let description = "";
      let params: ReceiptParam[] = [];
      const comment = leadingComments
        ? leadingComments[statement.leadingComments.length - 1]
        : null;
      if (comment) {
        if (comment.type === "CommentLine") {
          description = comment.value;
        } else if (comment.type === "CommentBlock") {
          const block = parseComment(`/*${comment.value}*/`)[0];
          description = block.description;
          params = block.tags
            .filter((v) => v.tag === "param")
            .map((v) => {
              const { name, type, description, optional } = v;
              return { name, type, description, optional };
            });
        }
      }
      const declaration = statement.declaration;
      if (declaration.type === "FunctionDeclaration") {
        if (declaration.id) {
          name = declaration.id.name;
        } else {
          if (statement.type === "ExportDefaultDeclaration") {
            name = "default";
          }
        }
      } else if (declaration.type === "VariableDeclaration") {
        const declaration2 = declaration.declarations[0];
        if (declaration2.type === "VariableDeclarator") {
          name = (declaration2.id as any).name;
        }
      }
      const fn = modules[name];
      if (fn && typeof fn === "function") {
        if (name === "default") defaultCmd = true;
        receipts.push({
          name,
          description,
          params,
          fn,
        });
      }
    }
    return {
      defaultCmd,
      receipts,
    };
  } catch (err) {
    return {
      receipts,
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
      checkFiles.push(pathResolve(dir, DEFAULT_FILE));
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
      const stat = await fileStat(checkFile);
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
