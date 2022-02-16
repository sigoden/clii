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
// This is vairable
export let foo = "bar"

// This is task1
export async function task1() {
  await $`pwd`
}

/**
 * This is task2 with parameters
 * @param {string} bar - this is command argument
 */
export async function task2(bar) {
  await $`echo ${foo} ${bar}`
}

```

2. run `cmru` in workspace root directory.

`cmru` will read `cmru.mjs` and generate cmd for each export functions.

```
$ cmru
Usage: cmru <cmd> [options]

Commands:
  cmru task1        This is task1
  cmru task2 <bar>  This is task2 with parameters

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific cmru file               [string] [default: "cmru.mjs"]
  -w, --workdir  Specific working directory                             [string]
      --verbose  Echo command                                          [boolean]
      --quiet    suppress all normal output                            [boolean]
      --foo      This is vairable                      [string] [default: "bar"]
  -h, --help     Show help                                             [boolean]

Not enough non-option arguments: got 0, need at least 1

$ cmru task1
/tmp/test-cmru

$ cmru task2 --foo baz goo
baz goo
```

## Exports

### variables

```js
// String variable
export let str = "0.1.0";
// Boolean variable
export let bool = false;
// Number variable
export let num = 3;
// Array varialbe
export let arr = [];
```

`cmru` maps exported variables to cli options

```
      --str      String variable                     [string] [default: "0.1.0"]
      --bool     Boolean variable                     [boolean] [default: false]
      --num      Number variable                           [number] [default: 3]
      --arr      Array varialbe                                          [array]
```

### functions

```js
/**
 * This is task3
 * @param {string} str - String variable
 * @param {boolean} bool - Boolean variable
 * @param {number} num - Number variable
 * @param {string[]} array - Array variable
 */
export async function task3(str, bool, num, array) {
  console.log(str, bool, num, array)
}
```

`cmru` maps exported functions to cli commands

```
cmru task3 <str> <bool> <num> <array...>

This is task3

Positionals:
  str    - String variable                                            [required]
  bool   - Boolean variable                                           [required]
  num    - Number variable                                            [required]
  array  - Array variable                       [array] [required] [default: []]
```

### default

```js
export default async function () {
  console.log("this is default cmd")
}
```

exec `cmru` without cmd will execute default function.

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

  let pictures = globby.globbySync('content/*.(jpg|png)')
}
```

see [globals](./docs/globals.md) for details.



## License

[Apache-2.0](LICENSE)

