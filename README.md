# Cmru

Cmru is a make-like build tool.

You writes plain js functions, cmru automatically generated subcommands/tasks.

- [Cmru](#cmru)
  - [Install](#install)
  - [Quick Start](#quick-start)
  - [Globals](#globals)
    - [`__filename` & `__dirname`](#__filename--__dirname)
    - [`require()`](#require)
    - [`argv`](#argv)
  - [License](#license)

## Install

```
npm i -g cmru
```

## Quick Start

Once `cmru` is installed and working, create a file named `cmrufile.mjs` in the root of your project with the following contents

```js
export const settings = {
  // Default port number
  port: 3000,
};

// A command
export async function cmd1() {
  console.log(`listening on http://localhost:${settings.port}`);
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
  console.log("invoke without arguments");
}

```

When you invoke `cmru` it looks for file `cmrufile.mjs` in the current directory and upwards, so you can invoke it from any subdirectory of your project.

Runing `cmru -h` list available subcommands.

```
Usage: cmru <cmd> [options]

Commands:
  cmru cmd1                      A command
  cmru cmd2 <message> [options]  Another command
  cmru default                                                         [default]

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific cmru file                                     [string]
  -w, --workdir  Specific working directory                             [string]
      --verbose  Echo command                                          [boolean]
      --silent   Suppress all normal output                            [boolean]
      --port     Default port number                    [number] [default: 3000]
  -h, --help     Show help                                             [boolean]
```

`cmru` generate custom cli options for exported variable `settings`.
```
      --port     Default port number                    [number] [default: 3000]
```

`cmru` generate subcommands from for each exported functions `cmd1`, `cmd2`, `default`.
```
Commands:
  cmru cmd1                  A command
  cmru cmd2 <pos> [options]  Another command
  cmru default                                                  [default]
```

```
$ cmru 
no arguments invoke default function

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
  -f, --file     Specific cmru file                                     [string]
  -w, --workdir  Specific working directory                             [string]
      --verbose  Echo command                                          [boolean]
      --silent   Suppress all normal output                            [boolean]
      --port     Default port number                    [number] [default: 3000]
      --foo      Option foo                                             [string]
      --bar      Option bar                                             [number]
  -h, --help     Show help                                             [boolean]

$ cmru -f examples/readme.mjs cmd2 --foo abc --bar 123 'hello world'
{"options":{"foo":"abc","bar":123},"message":"hello world"}
```

## Globals
### `__filename` & `__dirname`

In [ESM](https://nodejs.org/api/esm.html) modules, Node.js does not provide
`__filename` and `__dirname` globals. As such globals are really handy in scripts,
`cmru` provides these for use in `.mjs` files (when using the `cmru` executable).

### `require()`

In [ESM](https://nodejs.org/api/module.html#modulecreaterequirefilename)
modules, the `require()` function is not defined.

```js
let {version} = require('./package.json')
```

### `argv`

Argv object.

```ts
type Arguments<T = {}> = T & {
    /** Non-option arguments */
    _: Array<string | number>;
    /** The script name or node command */
    $0: string;
    /** All remaining options */
    [argName: string]: unknown;
};
```

## License

[Apache-2.0](LICENSE)

