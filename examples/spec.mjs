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

// Arguments are quoted
export async function testQuoteArgument() {
  let bar = 'bar"";baz!$#^$\'&*~*%)({}||\\/';
  assert((await $`echo ${bar}`).stdout.trim() === bar);
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

// Env vars is safe to pass
export async function testEnvVar2() {
  process.env.FOO = "hi; exit 1";
  await $`echo $FOO`;
}

// Globals are defined
export async function testGlobalVars() {
  console.log(__filename, __dirname);
}

// toString() is called on arguments
export async function testArgToString() {
  let foo = 0;
  let p = await $`echo ${foo}`;
  assert(p.stdout === "0\n");
}

// Can use array as an argument
export async function testArrayArg() {
  cd(rootDir);
  try {
    let files = ["./README.md", "./package.json"];
    await $`tar czf archive ${files}`;
  } finally {
    await $`rm archive`;
  }
}

// Quiet mode is working
export async function testQuiet() {
  cd(rootDir);
  let { stdout } = await $`node dist/main.js --quiet -f examples/dotenv.mjs`;
  assert(!stdout.includes("foo"));
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

// The pipe() throws if already resolved
export async function testPipeAgainThrow() {
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

// ProcessOutput::exitCode doesn't throw
export async function testExitCode() {
  assert((await $`grep qwerty README.md`.exitCode) !== 0);
  assert((await $`[[ -f ${__filename} ]]`.exitCode) === 0);
}

// nothrow() doesn't throw
export async function testNoThrow() {
  let { exitCode } = await nothrow($`exit 42`);
  assert(exitCode === 42);
}

// globby available
export async function testGlobby() {
  assert(globby === glob);
  assert(typeof globby === "function");
  assert(typeof globby.globbySync === "function");
  assert(typeof globby.globbyStream === "function");
  assert(typeof globby.generateGlobTasks === "function");
  assert(typeof globby.isDynamicPattern === "function");
  assert(typeof globby.isGitIgnored === "function");
  assert(typeof globby.isGitIgnoredSync === "function");
  console.log(chalk.greenBright("globby available"));
}

// cd() works with relative paths.
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

// The kill() method works.
export async function testKill() {
  let p = nothrow($`sleep 9999`);
  setTimeout(() => {
    p.kill();
  }, 100);
  await p;
}

// require() is working in ESM
export async function testRequire() {
  const { name, version } = require("../package.json");
  assert(typeof name === "string");
  console.log(chalk.black.bgYellowBright(` ${name} version is ${version} `));
}

export default async function () {
  await testStdout();
  await testEnvVar();
  await testQuoteArgument();
  await testQuoteEmpty();
  await testQuoteSpace();
  await testPipeFail();
  await testEnvVar2();
  await testGlobalVars();
  await testArgToString();
  await testArrayArg();
  await testQuiet();
  await testPipe();
  await testProcessoutError();
  await testPipeAgainThrow();
  await testExitCode();
  await testNoThrow();
  await testGlobby();
  await testCd();
  await testKill();
  await testRequire();
  console.log(chalk.greenBright(" 🍺 Success!"));
}
