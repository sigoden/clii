# cmru

cmru is a handy way to save and run project-specific commands in javascript.


## Install

```
npm i -g cmru
```

**Requirement**: Node version >= 16.0.0


## Quick start

1. create a `cmru.mjs` file in your workspace root directory.

```js
// This is options
export let options = {
  // Option foo
  foo: "foo",
};

// This is task1
export async function task1() {
  await $`pwd`;
}

/**
 * This is task2 with parameters
 * @param {string} bar - Argument bar
 */
export async function task2(bar) {
  await $`echo ${options.foo} ${bar}`;
}

```

2. run `cmru` in workspace root directory.

`cmru` will read `cmru.mjs` and generate subcommands for each export functions and cli options for export options.

```
$ cmru
Usage: cmru <cmd> [options]

Commands:
  main.js task1        This is task1
  main.js task2 <bar>  This is task2 with parameters

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific cmru file               [string] [default: "cmru.mjs"]
  -w, --workdir  Specific working directory                             [string]
      --verbose  Echo command                                          [boolean]
      --quiet    Suppress all normal output                            [boolean]
      --foo      Option foo                            [string] [default: "foo"]
  -h, --help     Show help                                             [boolean]

Not enough non-option arguments: got 0, need at least 1

$ cmru task1
/tmp/test-cmru

$ cmru task2 goo
foo goo

$ cmru task2 --foo baz goo
baz goo
```

## Exports

### options

```js
export const options = {
  // String variable
  str: "0.1.0",
  // Boolean variable
  bool: false,
  // Number variable
  num: 3,
  // Array varialbe
  arr: [],
};
```

`cmru` maps exported options to cli options.

```
      --str      String variable                     [string] [default: "0.1.0"]
      --bool     Boolean variable                     [boolean] [default: false]
      --num      Number variable                           [number] [default: 3]
      --arr      Array varialbe                            [array] [default: []]
```

### functions

```js
/**
 * Both parameters and options
 * @param {Object} options
 * @param {string} options.foo - Option foo
 * @param {number} options.bar - Option bar
 * @param {string} pos - Positional param
 */
export function task6(options, pos) {
  console.log(options, pos);
}

```

`cmru` maps exported functions to subcommands.

```
cmru task6 <pos> [options]

Both parameters and options

Positionals:
  pos  Positional param                                               [required]

Options:
      --foo      Option foo                                             [string]
      --bar      Option bar                                             [number]
```

### default

```js
export default async function () {
  console.log("this is default cmd")
}
```

call `cmru` without subcommand will run default function.

```sh
$ cmru
this is default cmd
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

