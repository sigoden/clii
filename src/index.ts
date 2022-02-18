import fs from "fs-extra";

import { globby, Options as LsOptions } from "globby";
import { promisify } from "util";
import os from "os";
import yaml from "yaml";
import path from "path";
import { createInterface } from "readline";
import { default as whichDefault, AsyncOptions as WhichOptions } from "which";
import { default as nodeFetch, RequestInfo, RequestInit } from "node-fetch";
import chalk from "chalk";
import { default as dotenvDefault, DotenvConfigOptions } from "dotenv";
import { $ } from "./exec";

export * from "./exec";

export { chalk, fs, os, path, yaml };

export const $config = {
  verbose: false,
  quiet: false,
  color: true,
  shell: "",
  shellArg: "",
};

export const sleep = promisify(setTimeout);

export function dotenv(options?: DotenvConfigOptions) {
  dotenvDefault.config(options);
}

export function cd(path: string) {
  if ($config.verbose) console.log("$", colorize(`cd ${path}`));
  process.chdir(path);
}

export function which(cmd: string, options?: WhichOptions) {
  if ($config.verbose) {
    if (typeof options !== "undefined") {
      console.log("$", colorize(`which ${cmd}`), options);
    } else {
      console.log("$", colorize(`which ${cmd}`));
    }
  }
  return whichDefault(cmd);
}

export { WhichOptions };

export type QuestionOptions = { choices: string[] };

export async function question(query?: string, options?: QuestionOptions) {
  let completer = undefined;
  if (Array.isArray(options?.choices)) {
    completer = function completer(line: string) {
      const completions = options.choices;
      const hits = completions.filter((c) => c.startsWith(line));
      return [hits.length ? hits : completions, line];
    };
  }
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
  });
  const question = (q?: string) =>
    new Promise((resolve) => rl.question(q ?? "", resolve));
  const answer = await question(query);
  rl.close();
  return answer;
}

export async function fetch(url: RequestInfo, init?: RequestInit) {
  if ($config.verbose) {
    if (typeof init !== "undefined") {
      console.log("$", colorize(`fetch ${url}`), init);
    } else {
      console.log("$", colorize(`fetch ${url}`));
    }
  }
  return nodeFetch(url, init);
}

export function ls(patterns: string | readonly string[], options?: LsOptions) {
  if ($config.verbose) {
    if (typeof options !== "undefined") {
      console.log("$", colorize(`ls ${patterns}`), options);
    } else {
      console.log("$", colorize(`ls ${patterns}`));
    }
  }
  return globby(patterns, options);
}

export { LsOptions };

export function colorize(cmd: string) {
  return cmd.replace(/^[\w_.-]+(\s|$)/, (substr) => {
    return $config.color ? chalk.greenBright(substr) : substr;
  });
}

export function registerGlobals() {
  Object.assign(global, {
    $,
    $config,
    // functions
    cd,
    ls,
    which,
    sleep,
    fetch,
    question,
    dotenv,
    // modules
    chalk,
    fs,
    os,
    path,
    yaml,
  });
}
