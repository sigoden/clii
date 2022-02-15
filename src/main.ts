#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import "./globals.js";

const hideBinArgv = hideBin(process.argv);

const defaultArgv = yargs(hideBinArgv).parseSync();

const receipts = load((defaultArgv.file as string) ?? "cmru.js");

const app = yargs(hideBinArgv)
  .usage("Usage: $0 <cmd> [options]")
  .help()
  .alias("h", "help")
  .parserConfiguration({
    "parse-numbers": false,
    "parse-positional-numbers": false,
  })
  .option("set", {
    type: "string",
    description: "Override set vars, e.g. --set foo:bar",
  })
  .option("file", {
    alias: "f",
    type: "string",
    default: "cmru.js",
    description: "Specific cmru file",
  })
  .option("shell", {
    type: "string",
    default: "sh",
    description: "Invoke shell to run recipes",
  })
  .option("shell-args", {
    type: "string",
    default: "-cu",
    description: "Invoke shell with shell-args as an argument",
  });

export interface Receipt {}

console.log(app.argv);
