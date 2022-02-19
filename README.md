# Cmru

Build cli applications by automatically converting js modules.

- [Cmru](#cmru)
  - [Quick Start](#quick-start)
  - [Explanation](#explanation)
  - [CLI](#cli)
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

## Explanation

Let's take [`example/reame.mjs`](./examples//readme.mjs) as an example.

The following is the content of the file:

```js
import cmru from "cmru";

cmru(import.meta.url);

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

Runing `node examples/readme.mjs -h` list available subcommands.

```
Usage: readme.mjs <cmd> [options]

Commands:
  readme.mjs cmd1                      A command
  readme.mjs cmd2 <message> [options]  Another command
  readme.mjs default                                                 [default]

Options:
      --version  Show version number                                   [boolean]
      --port     Default port number                    [number] [default: 3000]
  -h, --help     Show help                                             [boolean]
```

`cmru` generates global options according exported variable `settings`.
```
      --port     Default port number                    [number] [default: 3000]
```

`cmru` generates subcommands from according exported functions `cmd1`, `cmd2`, `default`.
```
Commands:
  readme.mjs cmd1                      A command
  readme.mjs cmd2 <message> [options]  Another command
  readme.mjs default                                                 [default]
```

```
$ node examples/readme.mjs
invoke without arguments

$ node examples/readme.mjs cmd1
listening on http://localhost:3000

$ node examples/readme.mjs cmd1 --port 4000
listening on http://localhost:4000

$ node examples/readme.mjs cmd2
readme.mjs cmd2 <message> [options]

Another command

Positionals:
  message  Positional param                                  [string] [required]

Options:
      --version  Show version number                                   [boolean]
      --port     Default port number                    [number] [default: 3000]
      --foo      Option foo                                             [string]
      --bar      Option bar                                             [number]
  -h, --help     Show help                                             [boolean]

Not enough non-option arguments: got 0, need at least 1

$ node examples/readme.mjs cmd2 --num 3 --mode prod 'hello world'
{"options":{"num":3,"mode":"prod"},"message":"hello world"}
```

## CLI

`cmru` is not only a library for building cli app, but also a task runner / build tool.

When you invoke `cmru`, it looks for file `cmrufile.mjs` in the current directory and upwards, so you can invoke it from any subdirectory of your project.

`cmrufile.mjs` to `cmru` like `npm scripts` to `npm` or `Makefile` to `make`. 

## License

[Apache-2.0](LICENSE)

