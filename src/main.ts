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
  polyfillESM,
} from "./index";
import fs from "fs/promises";

async function main() {
  const rawArgv = patchRawArgv(hideBin(process.argv));
  const defaultArgv = yargs(rawArgv).parseSync();
  let app = yargs(rawArgv)
    .usage("Usage: $0 <cmd> [options]")
    .help()
    .alias("h", "help")
    .option("file", {
      alias: "f",
      type: "string",
      description: "Specific clii file",
    })
    .option("workdir", {
      alias: "w",
      type: "string",
      description: "Specific working directory",
    })
    .implies("workdir", "file");

  try {
    const file = await findCliifile(defaultArgv);
    const workdir = getWorkdir(defaultArgv, file);
    process.chdir(workdir);
    polyfillESM(file);
    const moduleExports = await import(file);
    const yargsData = await parse(file, moduleExports);
    app = buildYargs(app, yargsData, async (command, argv) => {
      global.argv = argv;
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

async function findCliifile(argv: Record<string, any>) {
  const argFile: string = argv.file || argv.f;
  const checkFiles = [];
  if (argFile) {
    checkFiles.push(resolve(argFile));
  } else {
    let dir = process.cwd();
    while (true) {
      checkFiles.push(resolve(dir, "cliifile.mjs"));
      checkFiles.push(resolve(dir, "Cliifile.mjs"));
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
