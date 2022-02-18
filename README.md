# cmru

cmru is a command runner that allows you to describe build tasks in javascript.

![screenshot](https://user-images.githubusercontent.com/4012553/154598176-91ee8666-e67c-4d34-88f5-9191dcf1c30f.png)

## Install

```
npm i -g cmru
```

**Requirement**: Node version >= 16.0.0

## Quick Start

Once `cmru` is installed and working, create a file named `cmru.mjs` in the root of your project with the following contents

```js
export const settings = {
  // Default port number
  port: 3000,
};

// A command
export async function cmd1() {
  await $`npx serve -l ${settings.port}`;
}

/**
 * Another command
 * @param {Object} options
 * @param {string} options.foo - Option foo
 * @param {number} options.bar - Option bar
 * @param {string} message - Positional param
 */
export async function cmd2(options, message) {
  console.log(JSON.stringify({ options, message }));
}

export default function () {
  console.log("no arguments invoke default function");
}

```

When you invoke `cmru` it looks for file `cmru.mjs` in the current directory and upwards, so you can invoke it from any subdirectory of your project.

Runing `cmru -h` list available subcommands.

```
Usage: cmru <cmd> [options]

Commands:
  cmru cmd1                      A command
  cmru cmd2 <message> [options]  Another command
  cmru default                                                         [default]

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific cmru file               [string] [default: "cmru.mjs"]
  -w, --workdir  Specific working directory                             [string]
      --verbose  Echo command                                          [boolean]
      --quiet    Suppress all normal output                            [boolean]
      --port     Default port number                    [number] [default: 3000]
  -h, --help     Show help                                             [boolean]
```

`cmru` reads export variable `settings` then renders cli options
```
      --port     Default port number                    [number] [default: 3000]
```

`cmru` reads export functions `cmd1`, `cmd2`, `default` then renders subcommands.
```
Commands:
  cmru cmd1                  A command
  cmru cmd2 <pos> [options]  Another command
  cmru default                                                  [default]
```

Running `cmru` with no arguments will call default function.

```
$ cmru 
no arguments invoke default function
```

```
$ cmru cmd1
INFO: Accepting connections at http://localhost:3000

$ cmru cmd1 --port 4000
INFO: Accepting connections at http://localhost:4000

$ cmru cmd2 --foo abc --bar 123 
cmru cmd2 <message> [options]

Another command

Positionals:
  message  Positional param                                           [required]

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific cmru file               [string] [default: "cmru.mjs"]
  -w, --workdir  Specific working directory                             [string]
      --verbose  Echo command                                          [boolean]
      --quiet    Suppress all normal output                            [boolean]
      --port     Default port number                    [number] [default: 3000]
      --foo      Option foo                                             [string]
      --bar      Option bar                                             [number]
  -h, --help     Show help                                             [boolean]

$ cmru -f examples/readme.mjs cmd2 --foo abc --bar 123 'hello world'
{"options":{"foo":"abc","bar":123},"message":"hello world"}
```

## Globals

All functions ($, cd, fetch...) and modules (chalk, fs, path...) are available straight away without any imports.

```js
export async function task() {
  await $`mkdir -p dist`;

  await Promise.all([
    $`sleep 1; echo 1`,
    $`sleep 2; echo 2`,
    $`sleep 3; echo 3`,
  ]);

  let resp = await fetch("https://httpbin.org/ip");
  if (resp.ok) {
    console.log(await resp.text());
  }

  let scripts = await ls(["src/**/*.ts"]);
}
```

see [globals](https://github.com/sigoden/cmru/blob/main/docs/globals.md) for details.


## License

[Apache-2.0](LICENSE)

