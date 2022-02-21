# Clii

Easily build a cli app.

Write some functions, jsdoc it, clii automatically turns it into a cli.

![examples/demo.mjs](https://user-images.githubusercontent.com/4012553/154807539-f8f554f5-82da-4d3b-8cc8-578cfc661535.png)

- [Clii](#clii)
  - [Quick Start](#quick-start)
  - [Cli Tool](#cli-tool)
  - [License](#license)

## Quick Start

Install clii package.

```
npm i clii
yarn add clii
```

 Write some js code

```js
/**
 * A simple task
 * @param {Object} options
 * @param {number} options.num - Num variable
 * @param {("prod"|"dev"|"stage")} options.mode - Build mode
 */
export async function task(options) {
  console.log(options);
}
```

Add follow content to your file.

```js
import clii from "clii";

clii(import.meta.url);
```

All done.

What an easy way to build the cli app.

Try it in your terminal
```
$ node index.mjs task1 -h
index.mjs task1 [options]

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific clii file                                     [string]
  -w, --workdir  Specific working directory                             [string]
      --num      Num variable                                           [number]
      --mode     Build mode           [string] [choices: "prod", "dev", "stage"]
  -h, --help     Show help                                             [boolean]

$ node index.mjs task --num 3 --mode prod
{ num: 3, mode: 'prod' }
```

`clii` parse your ast js module file, generate cli interface according comments and exports semantics.

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

Export function `cmd2` will be parsed as subcommand. It's parameters will be parsed as subcommand's options.

```
Commands:
  demo.mjs cmd2 <message> [options]  Another command
```

The export default function will be th default command.

## Cli Tool

Since `clii` can run js functions directly from cli, it can be used as task runner / build tool.

By defualt. `clii` looks for file `cliifile.mjs` in the current directory and upwards, so you can invoke it from any subdirectory of your project. 

You can organize your project scripts with `cliifile.mjs` to provide unified entrypoint and help information.

```js
export function lint() {}
/**
 * Build
 * @param {Object} options
 * @param {boolean} options.prod
 */
export function build(options) {
  lint();
}
```

```
$ clii
Usage: clii <cmd> [options]

Commands:
  clii lint
  clii build [options]  Build

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific clii file                                     [string]
  -w, --workdir  Specific working directory                             [string]
  -h, --help     Show help                                             [boolean]

$ clii build
$ clii lint
```


## License

[Apache-2.0](LICENSE)

