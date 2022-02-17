import { strict as assert } from "assert";

const rootDir = path.resolve(__dirname, "..");

// Test __dirname, __filename
export async function testPolyfill() {
  assert(__dirname.length > 0);
  assert(__filename.length > 0);
}

export async function testRequire() {
  const { name } = require("../package.json");
  assert(typeof name === "string");
}

export async function testArgv() {
  console.log(argv);
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

export async function testLs() {
  const files = await ls(".");
  assert(files.length > 0);
}

export async function testWhich() {
  const nodePath = await which("node");
  assert(nodePath.length > 0);
}

export default async function () {
  await testPolyfill();
  await testRequire();
  await testArgv();
  await testCd();
  await testLs();
  await testWhich();
  console.log(chalk.greenBright(" 🍺 Success!"));
}
