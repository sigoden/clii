# Clii

Invoke js functions from terminal directly.

![examples/demo.mjs](https://user-images.githubusercontent.com/4012553/154807539-f8f554f5-82da-4d3b-8cc8-578cfc661535.png)

- [Clii](#clii)
  - [Quick Start](#quick-start)
  - [Cli Tool](#cli-tool)
  - [License](#license)

## Quick Start

1. Write some js code

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

2. Install clii package.

```
npm i clii
yarn add clii
```

3. Add follow content to your file.

```js
import clii from "clii";

clii(import.meta.url);
```

All done.

What an easy way to build the cli app.

Try it in your terminal
```
$ node demo.mjs cmd2 -h
demo.mjs cmd2 <message> [options]

Another command

Positionals:
  message  Positional param                                  [string] [required]

Options:
      --port     Default port number                    [number] [default: 3000]
      --num      Num variable                                           [number]
      --mode     Build mode           [string] [choices: "prod", "dev", "stage"]

$ node demo.mjs cmd2 --num 3 --mode prod 'hello world'
{"options":{"num":3,"mode":"prod"},"message":"hello world"}
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

```
Usage: clii <cmd> [options]

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific clii file                                     [string]
  -w, --workdir  Specific working directory                             [string]
  -h, --help     Show help                                             [boolean]
```

By defualt. `clii` looks for file `cliifile.mjs` in the current directory and upwards, so you can invoke it from any subdirectory of your project. 

You can specify a file with option `--file <path-to-script.mjs>`. 

The workdir will be the folder contains the mjs file. Use option `---workdir <path-to-dir>` to change it.

Since `clii` can run js functions directly from cli, it can be used as task runner / build tool.

For examples, Write the following to the file `cliifile.mjs`.

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

```
clii lint
clii build
```
## License

[Apache-2.0](LICENSE)

