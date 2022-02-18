#!/usr/bin/env cmru -f

/// <reference path="../src/globals.ts" />

import { strict as assert } from "assert";

const rootDir = path.resolve(__dirname, "..");

// Only stdout is used during command substitution
export async function testStdout() {
  let hello = await $`echo Error >&2; echo Hello`;
  let len = +(await $`echo ${hello} | wc -c`);
  assert(len === 6);
}

// Pass env var
export async function testEnvVar() {
  process.env.FOO = "foo";
  let foo = await $`echo $FOO`;
  assert(foo.stdout === "foo\n");
}

// Undefined and empty string correctly quoted
export async function testQuoteEmpty() {
  $`echo ${undefined}`;
  $`echo ${""}`;
}

// Can create a dir with a space in the name
export async function testQuoteSpace() {
  let name = "foo bar";
  try {
    await $`mkdir /tmp/${name}`;
  } finally {
    await fs.rmdir("/tmp/" + name);
  }
}

// toString() is called on arguments
export async function testArgToString() {
  let foo = 0;
  let p = await $`echo ${foo}`;
  assert(p.stdout === "0\n");
}

// Can use array as an argument
export async function testArgArray() {
  cd(rootDir);
  try {
    let files = ["./README.md", "./package.json"];
    await $`tar czf archive ${files}`;
  } finally {
    await $`rm archive`;
  }
}

// Pipes are working
export async function testPipe() {
  let { stdout } = await $`echo "hello"`
    .pipe($`awk '{print $1" world"}'`)
    .pipe($`tr '[a-z]' '[A-Z]'`);
  assert(stdout === "HELLO WORLD\n");

  try {
    await $`echo foo`.pipe(fs.createWriteStream("/tmp/output.txt"));
    assert((await fs.readFile("/tmp/output.txt")).toString() === "foo\n");

    let r = $`cat`;
    fs.createReadStream("/tmp/output.txt").pipe(r.stdin);
    assert((await r).stdout === "foo\n");
  } finally {
    await fs.rm("/tmp/output.txt");
  }
}

// Pipefail is on
export async function testPipeFail() {
  let p;
  try {
    p = await $`cat /dev/not_found | sort`;
  } catch (e) {
    console.log("Caught an exception -> ok");
    p = e;
  }
  assert(p.exitCode !== 0);
}

// The pipe() throws if already resolved
export async function testPipeTwice() {
  let out,
    p = $`echo "Hello"`;
  await p;
  try {
    out = await p.pipe($`less`);
  } catch (err) {
    console.log(err);
    assert.equal(
      err.message,
      `The pipe() method shouldn't be called after promise is already resolved!`
    );
    console.log("☝️ Error above is expected");
  }
  if (out) {
    assert.fail("Expected failure!");
  }
}

// ProcessOutput thrown as error
export async function testProcessoutError() {
  let err;
  try {
    await $`wtf`;
  } catch (p) {
    err = p;
  }
  console.log(err);
  assert(err.exitCode > 0);
  console.log("☝️ Error above is expected");
}

// ProcessOutput::exitCode doesn't throw
export async function testExitCode() {
  assert((await $`grep qwerty README.md`.exitCode) !== 0);
  assert((await $`[ -f ${__filename} ]`.exitCode) === 0);
}

// Nothrow doesn't throw
export async function testNoThrow() {
  let { exitCode } = await $`exit 42`.nothrow;
  assert(exitCode === 42);
}

// Silent Silent suppress normal output
export async function testSilent() {
  await $`echo abc`;
  await $`echo def`.silent;
}

// The kill() method works.
export async function testKill() {
  let p = $`sleep 9999`.nothrow;
  setTimeout(() => {
    p.kill();
  }, 100);
  await p;
}

export default async function () {
  await testStdout();
  await testEnvVar();
  await testQuoteEmpty();
  await testQuoteSpace();
  await testArgToString();
  await testArgArray();
  await testPipe();
  await testPipeFail();
  await testProcessoutError();
  await testPipeTwice();
  await testExitCode();
  await testNoThrow();
  await testSilent();
  await testKill();
}
