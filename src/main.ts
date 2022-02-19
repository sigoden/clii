#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { resolve, dirname } from "path";
import {
  patchRawArgv,
  parse,
  buildYargs,
  revertPatchedArgv,
  updateGlobalOptions,
  getCommandParams,
} from "./index";
import fs from "fs/promises";

async function main() {
  const rawArgv = patchRawArgv(hideBin(process.argv));
  const defaultArgv = yargs(rawArgv).parseSync();
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
  try {
    const file = await findCmrufile(defaultArgv);
    const workdir = getWorkdir(defaultArgv, file);
    process.chdir(workdir);
    const moduleExports = await import(file);
    const yargsData = await parse(file, moduleExports);
    app = buildYargs(app, yargsData, async (command, argv) => {
      try {
        revertPatchedArgv(argv);
        updateGlobalOptions(yargsData, argv, moduleExports);
        const params = getCommandParams(command, argv);
        await moduleExports[command.name](...params);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.log(await app.getHelp());
    if (!(defaultArgv.h || defaultArgv.help)) {
      console.log("\n" + err);
    }
  }
  app.argv;
}

main();

async function findCmrufile(argv: Record<string, any>) {
  const argFile: string = argv.file || argv.f;
  const checkFiles = [];
  if (argFile) {
    checkFiles.push(resolve(argFile));
  } else {
    let dir = process.cwd();
    while (true) {
      checkFiles.push(resolve(dir, "cmrufile.mjs"));
      checkFiles.push(resolve(dir, "Cmrufile.mjs"));
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
  if (!file) throw new Error("Not found cmcufile");
  return file;
}

function getWorkdir(argv: Record<string, any>, file: string) {
  const workdir: string = argv.workdir;
  if (!workdir) {
    return dirname(file);
  } else {
    return resolve(workdir);
  }
}
