#!/usr/bin/env cmru -f

/// <reference path="../src/globals.ts" />

import { strict as assert } from "assert";

$config.color = false;

const rootDir = path.resolve(__dirname, "..");

export async function testCmd() {
  await $`echo hi`;
}

export async function testConfigVerbose() {
  const oldVerbose = $config.verbose;
  $config.verbose = false;
  await $`echo 1`;
  $config.verbose = true;
  await $`echo 2`;
  $config.verbose = oldVerbose;
}

export async function testConfigSilent() {
  const oldSilent = $config.silent;
  $config.silent = false;
  await $`echo 1`;
  $config.silent = true;
  await $`echo 2`;
  $config.silent = oldSilent;
}

export async function testConfigFatal() {
  const oldFatal = $config.fatal;

  $config.fatal = false;
  shell.cp("this_file_does_not_exist1", "/dev/null"); // throws Error here
  await $`cp this_file_does_not_exist2 /dev/null`; // throws Error here

  $config.fatal = true;
  let shellThrows = 0;
  try {
    shell.cp("this_file_does_not_exist3", "/dev/null"); // throws Error here
  } catch (err) {
    console.log(err.message);
    shellThrows += 1;
  }
  assert(shellThrows, 1);

  let $throws = 0;
  try {
    await $`cp this_file_does_not_exist4 /dev/null`; // throws Error here
  } catch {
    $throws += 1;
  }
  assert($throws, 1);
  $config.fatal = oldFatal;
}

export async function testPolyfill() {
  assert(__dirname.length > 0);
  assert(__filename.length > 0);
}

export async function testRequire() {
  const { name } = require("../package.json");
  assert(typeof name === "string");
}

export async function testArgv() {
  assert(argv.$0);
}

export async function testCd() {
  try {
    fs.mkdirpSync("/tmp/cmru-cd-test/one/two");
    cd("/tmp/cmru-cd-test/one/two");
    cd("..");
    cd("..");
    let pwd = (await $`pwd`).stdout.trim();
    assert.equal(path.basename(pwd), "cmru-cd-test");
  } finally {
    fs.rmSync("/tmp/cmru-cd-test", { recursive: true });
    cd(rootDir);
  }
}

export async function testGlob() {
  const files = await glob(".");
  assert(files.length > 0);
}

export async function testShell() {
  assert(shell.echo("hello").stdout, "hello");
}

export async function testYaml() {
  assert(yaml.parse("foo: bar").foo, "bar");
}

export async function testChalk() {
  assert(!!chalk.bgBlack);
}

export default async function () {
  await testCmd();
  await testConfigVerbose();
  await testConfigSilent();
  await testConfigFatal();
  await testPolyfill();
  await testRequire();
  await testArgv();
  await testCd();
  await testGlob();
  await testShell();
  await testYaml();
  await testChalk();
}
