# Cmru

Build cli applications by automatically converting js modules.

![examples/readme.mjs](https://user-images.githubusercontent.com/4012553/154787191-87252e55-35ae-4db5-99a7-13c727bdd48c.png)

- [Cmru](#cmru)
  - [Quick Start](#quick-start)
  - [Guide](#guide)
  - [Cli](#cli)
  - [License](#license)

## Quick Start

1. Install cmru package.

```
npm i cmru
yarn add cmru
```

2. Add follow content to the head of your module file.

```js
import cmru from "cmru";

cmru(import.meta.url);
```

All done. It's a cli app now.

## Guide

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
eadme.mjs cmd2 <message> [options]

Another command

Positionals:
  message  Positional param                                  [string] [required]

Options:
      --port     Default port number                    [number] [default: 3000]
      --num      Num variable                                           [number]
      --mode     Build mode           [string] [choices: "prod", "dev", "stage"]
```

## Cli

`cmru` is not only a library for building cli app, but also a task runner / build tool.

When you invoke `cmru`, it looks for file `cmrufile.mjs` in the current directory and upwards, so you can invoke it from any subdirectory of your project.

`cmrufile.mjs` to `cmru` like `npm scripts` to `npm` or `Makefile` to `make`. 

## License

[Apache-2.0](LICENSE)

