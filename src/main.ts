#!/usr/bin/env node

import yargs from "yargs";
import { resolve } from "path";
import { hideBin } from "yargs/helpers";
import { explainSync } from "jsdoc-api";
import { readFile } from "fs/promises";
import { registerGlobals, vars, $ } from "./index.js";

const hideBinArgv = hideBin(process.argv);

async function main() {
  registerGlobals();
  const defaultArgv = yargs(hideBinArgv).parseSync();
  const script = await loadScript(
    resolve(
      (defaultArgv.file as string) ?? (defaultArgv.f as string) ?? "cmru.js"
    )
  );
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
      default: "cmru.js",
      description: "Specific cmru file",
    })
    .option("verbose", {
      type: "boolean",
      description: "Echo commands",
    });
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
      if (param.type.endsWith("[]")) {
        cmd += ` <${param.name}...>`;
      } else {
        cmd += ` <${param.name}>`;
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
        $.verbose = !!argv["verbose"];

        for (const [key, { value, description }] of vars.entries()) {
          vars.set(key, { description, value: argv[key] || value });
        }
        const args = receipt.params.map((param) => argv[param.name]);
        await receipt.fn(...args);
      }
    );
  }
  if (!script.error) {
    app = app.demandCommand();
  } else {
    console.log(await app.getHelp());
    console.log("\n" + script.error);
  }
  app.argv;
}

main();
interface Script {
  receipts: Receipt[];
  error?: string;
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
  properties: string;
}

async function loadScript(file: string): Promise<Script> {
  try {
    const source = await readFile(file, "utf-8");
    const modules = await import(file);
    const jsdocValues = explainSync({ source });
    const receipts: Receipt[] = [];
    for (const name of Object.keys(modules)) {
      const fn = modules[name];
      if (typeof fn === "function") {
        const docValue = jsdocValues.find(
          ({ scope, kind, comment, name: fnName }) =>
            scope === "global" &&
            kind === "function" &&
            !!comment &&
            fnName === name
        );
        const description = docValue?.description || "";
        const params =
          docValue?.params?.map(({ name, description, type }) => ({
            name,
            description,
            type: getParamType(type.names[0]),
          })) || [];
        receipts.push({
          name,
          description,
          fn,
          params,
        });
      }
    }
    return {
      receipts,
    };
  } catch (err) {
    return {
      receipts: [],
      error: err.message,
    };
  }
}

function getParamType(type: string) {
  const exe = /Array.\<(\w+)\>/.exec(type);
  if (exe) return exe[1] + "[]";
  return type;
}
