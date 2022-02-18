const path = require("path");
const exec = require("child_process").exec;

describe("examples - dotenv", () => {
  it(".env file works", async () => {
    let result = await cli(["-f", resolveRootDir("examples/dotenv.mjs")]);
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
    let result = await cli([...prefixs, "task4", "a", "b", "c"]);
    expect(result.stdout).toMatchSnapshot();
  });
  it("task4 works2", async () => {
    let result = await cli([...prefixs, "task4", "'-a -b -c'", "'-x -y -z'"]);
    expect(result.stdout).toMatchSnapshot();
  });
  it("task5 works", async () => {
    let result = await cli([
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
    expect(result.stdout).toMatchSnapshot();
  });
  it("task5 works2", async () => {
    let result = await cli([...prefixs, "task5", "--str", "'-a -b -c'"]);
    expect(result.stdout).toMatchSnapshot();
  });
  it("task6 works", async () => {
    let result = await cli([
      ...prefixs,
      "task6",
      "--foo",
      "abc",
      "--bar",
      "123",
      "ooo",
    ]);
    expect(result.stdout).toMatchSnapshot();
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

describe("examples - globals", () => {
  const prefixs = ["-f", resolveRootDir("examples/globals.mjs")];
  it("render cli", async () => {
    let result = await cli([...prefixs, "-h"]);
    expect(result.stdout).toMatchSnapshot();
  });
  it("it works", async () => {
    let result = await cli(prefixs);
    expect(result.stdout).toMatchSnapshot();
  });
});

describe("global options", () => {
  const prefixs = ["-f", resolveRootDir("examples/globals.mjs")];
  it("run with --quiet", async () => {
    let result = await cli(["--quiet", ...prefixs, "testCmd"]);
    expect(result.stdout).toMatchSnapshot();
  });
  it("run with --verbose", async () => {
    let result = await cli(["--verbose", ...prefixs, "testCmd"]);
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
