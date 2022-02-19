# Cmru

Build cli app by writing plain js functions.

![examples/readme.mjs](https://user-images.githubusercontent.com/4012553/154787191-87252e55-35ae-4db5-99a7-13c727bdd48c.png)

- [Cmru](#cmru)
  - [Quick Start](#quick-start)
  - [How it works](#how-it-works)
  - [Cli](#cli)
  - [License](#license)

## Quick Start

1. Install cmru package.

```
npm i cmru
yarn add cmru
```

2. Add follow content to your file.

```js
import cmru from "cmru";

cmru(import.meta.url);
```

All done.

`cmru` automatically convert your file to cli app.


Try [`examples/readme.mjs`](examples/readme.mjs) yourself.

## How it works

`cmru` parse your ast js module file, generate cli interface according comments and exports semantics.

Export variable `settings` will be parsed as global options.
```
export const settings = {
  // Default port number
  port: 3000,
};
```
```
Options:
      --port     Default port number                    [number] [default: 3000]
```

Export function `cmd1`, `cmd2` will be parsed as subcommand.

```
Commands:
  readme.mjs cmd1                      A command
  readme.mjs cmd2 <message> [options]  Another command
```

The parameters of function will be parsed as subcommand's options.

```js
/**
 * Another command
 * @param {Object} options
 * @param {number} options.num - Num variable
 * @param {("prod"|"dev"|"stage")} options.mode - Build mode
 * @param {string} message - Positional param
 */
export async function cmd2(options, message) {
}
```

```
readme.mjs cmd2 <message> [options]

Another command

Positionals:
  message  Positional param                                  [string] [required]

Options:
      --port     Default port number                    [number] [default: 3000]
      --num      Num variable                                           [number]
      --mode     Build mode           [string] [choices: "prod", "dev", "stage"]
```

**The export default function will be th default command**. your can run it's without passing any argument.

## Cli

`cmru` is not only a library for building cli app, but also a cli tool itself.

```
Usage: cmru <cmd> [options]

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific cmru file                                     [string]
  -w, --workdir  Specific working directory                             [string]
  -h, --help     Show help                                             [boolean]
```

By defualt. `cmru` looks for file `cmrufile.mjs` in the current directory and upwards, so you can invoke it from any subdirectory of your project. 

You can specify a file with option `--file <path-to-script.mjs>`. 

The workdir will be the folder contains the mjs file. Use option `---workdir <path-to-dir>` to change it.

Since `cmru` can run js functions directly from cli, it can be used as task runner / build tool.

For examples, Write the following to the file `cmrufile.mjs`.

```ts
import sh from "shelljs";

export function lint() {}

/**
 * @param {("prod"|"dev"|"stage")} mode
 */
export function build(mode) {
  lint();
  sh.exec(`tsc tsconfig.${mode}.json`);
}
```

`cmru lint` will run lint function, `cmru build` will run build function.

## License

[Apache-2.0](LICENSE)

