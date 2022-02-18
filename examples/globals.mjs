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
  await $`echo hi`;
  $config.verbose = true;
  await $`echo hi`;
  $config.verbose = oldVerbose;
}

export async function testConfigSilent() {
  const oldSilent = $config.silent;
  $config.silent = false;
  await $`echo hi`;
  $config.silent = true;
  await $`echo hi`;
  $config.silent = oldSilent;
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
  await testPolyfill();
  await testRequire();
  await testArgv();
  await testCd();
  await testGlob();
  await testShell();
  await testYaml();
  await testChalk();
}
