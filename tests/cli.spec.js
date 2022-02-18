const path = require("path");
const exec = require("child_process").exec;

describe("cmru", () => {
  it("no arguments", async () => {
    let result = await cli([]);
    expect(result.stdout).toMatchSnapshot();
  });
  it("--help", async () => {
    let result = await cli(["-h"]);
    expect(result.stdout).toMatchSnapshot();
  });
});

describe("examples - functions", () => {
  const prefixs = ["-f", resolveRootDir("examples/functions.mjs")];
  it("render cli", async () => {
    let result = await cli([...prefixs, "-h"]);
    expect(result.stdout).toMatchSnapshot();
  });
  it("task4 works", async () => {
    let result = await cli([...prefixs, "task4", "-h"]);
    expect(result.stdout).toMatchSnapshot();
    let result2 = await cli([...prefixs, "task4", "a", "b", "c"]);
    expect(result2.stdout).toMatchSnapshot();
    let result3 = await cli([...prefixs, "task4", "'-a -b -c'", "'-x -y -z'"]);
    expect(result3.stdout).toMatchSnapshot();
  });
  it("task5 works", async () => {
    let result = await cli([...prefixs, "task5", "-h"]);
    expect(result.stdout).toMatchSnapshot();
    let result2 = await cli([
      ...prefixs,
      "task5",
      "--str",
      "abc",
      "--num",
      "3",
      "--bool",
      "--arr",
      "x",
      "--arr",
      "y",
    ]);
    expect(result2.stdout).toMatchSnapshot();
    let result3 = await cli([...prefixs, "task5", "--str", "'-a -b -c'"]);
    expect(result3.stdout).toMatchSnapshot();
  });
  it("task6 works", async () => {
    let result = await cli([...prefixs, "task6", "-h"]);
    expect(result.stdout).toMatchSnapshot();
    let result2 = await cli([
      ...prefixs,
      "task6",
      "--foo",
      "abc",
      "--bar",
      "123",
      "ooo",
    ]);
    expect(result2.stdout).toMatchSnapshot();
  });
  it("task7 works", async () => {
    let result = await cli([...prefixs, "task7", "-h"]);
    expect(result.stdout).toMatchSnapshot();
    let result2 = await cli([...prefixs, "task7", "--select", "x", "dev", "1"]);
    expect(result2.stdout).toMatchSnapshot();
  });
});

describe("examples - settings", () => {
  const prefixs = ["-f", resolveRootDir("examples/settings.mjs")];
  it("render cli", async () => {
    let result = await cli([...prefixs, "-h"]);
    expect(result.stdout).toMatchSnapshot();
  });
  it("it works", async () => {
    let result = await cli([
      ...prefixs,
      "--str",
      "abc",
      "--num",
      "3",
      "--bool",
      "--arr",
      "x",
      "--arr",
      "y",
    ]);
    expect(result.stdout).toMatchSnapshot();
  });
});

function resolveRootDir(file) {
  return path.resolve(__dirname, "..", file);
}

function cli(args, cwd) {
  return new Promise((resolve) => {
    exec(
      `node ${resolveRootDir("dist/main.js")} ${args.join(" ")}`,
      { cwd },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr,
        });
      }
    );
  });
}
