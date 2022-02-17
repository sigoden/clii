# cmru

cmru is a handy way to save and run project-specific commands in javascript.

![screenshot](https://user-images.githubusercontent.com/4012553/154531110-2403b6ff-4591-4519-81a4-2a8dc88b56e9.png)

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
  const { stdout } = await $`node --version`.quiet;
  console.log(`node: ${stdout.trim()}, port: ${settings.port}`);
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
node: v16.13.0, port: 3000

$ cmru cmd1 --port 4000
node: v16.13.0, port: 4000

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
export async function task1() {
  await $`cat package.json | grep name`

  await Promise.all([
    $`sleep 1; echo 1`,
    $`sleep 2; echo 2`,
    $`sleep 3; echo 3`,
  ])

  let resp = await fetch('http://wttr.in')
  if (resp.ok) {
    console.log(await resp.text())
  }

  let pictures = ls('content/*.(jpg|png)')
}
```

see [globals](./docs/globals.md) for details.


## License

[Apache-2.0](LICENSE)

