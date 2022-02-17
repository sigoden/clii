# Globals

- [Globals](#globals)
  - [``$`command` ``](#command-)
    - [`ProcessPromise`](#processpromise)
    - [`ProcessOutput`](#processoutput)
  - [Functions](#functions)
    - [`cd()`](#cd)
    - [`ls()`](#ls)
    - [`which()`](#which)
    - [`fetch()`](#fetch)
    - [`question()`](#question)
    - [`sleep()`](#sleep)
    - [`dotenv()`](#dotenv)
  - [Packages](#packages)
    - [`chalk` package](#chalk-package)
    - [`fs` package](#fs-package)
    - [`os` package](#os-package)
    - [`path` package](#path-package)
    - [`yaml` package](#yaml-package)
  - [Configuration](#configuration)
    - [`$config.verbose`](#configverbose)
    - [`$config.quiet`](#configquiet)
    - [`$config.shell`](#configshell)
    - [`$config.shellArg`](#configshellarg)
    - [`$config.color`](#configcolor)
  - [Polyfills](#polyfills)
    - [`__filename` & `__dirname`](#__filename--__dirname)
    - [`require()`](#require)
  - [Misc](#misc)
    - [`argv`](#argv)



All functions ($, cd, fetch, etc) are available straight away without any imports.

Or import globals explicitly (for better autocomplete in VS Code).

```js
import 'cmru/globals'
```

or

```js
/// <reference path="path-to-global-node_modules/cmru/dist/globals.d.ts" />
```

## ``$`command` ``

> Idea comes from [`zx`](https://github.com/google/zx)

Executes a given string using the `spawn` function from the
`child_process` package and returns `ProcessPromise<ProcessOutput>`.

Everything passed through `${...}` will be automatically escaped and quoted.

```js
let name = 'foo & bar'
await $`mkdir ${name}`
```

**There is no need to add extra quotes.** Read more about it in 
[quotes](./quotes.md).

You can pass an array of arguments if needed:

```js
let flags = [
  '--oneline',
  '--decorate',
  '--color',
]
await $`git log ${flags}`
```

If the executed program returns a non-zero exit code,
`ProcessOutput` will be thrown.

```js
try {
  await $`exit 1`
} catch (p) {
  console.log(`Exit code: ${p.exitCode}`)
  console.log(`Error: ${p.stderr}`)
}
```

You can use `nothrow` to catch exitcode

```js
  const { exitCode } = await $`exit 1`.nothrow
```

### `ProcessPromise`

```ts
class ProcessPromise<T> extends Promise<T> {
  readonly stdin: Writable
  readonly stdout: Readable
  readonly stderr: Readable
  readonly exitCode: Promise<number>
  readonly nothrow: this
  pipe(dest): ProcessPromise<T>
  kill(signal = 'SIGTERM'): Promise<void>
}
```

The `pipe()` method can be used to redirect stdout:

```js
await $`cat file.txt`.pipe(process.stdout)
```

Read more about [pipelines](./pipelines.md).

### `ProcessOutput`

```ts
class ProcessOutput {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
  toString(): string
}
```

## Functions

### `cd()`

Changes the current working directory.

```js
cd('/tmp')
await $`pwd` // outputs /tmp
```

### `ls()`

ls files by glob matching.

```js
let packages = await ls(['package.json', 'packages/*/package.json'])
let pictures = await ls('content/*.(jpg|png)')
```

### `which()`

```js
let bash = await which("bash");
console.log(bash) // /bin/bash
```

### `fetch()`

A wrapper around the [node-fetch](https://www.npmjs.com/package/node-fetch) package.

```js
let resp = await fetch('http://wttr.in')
if (resp.ok) {
  console.log(await resp.text())
}
```

### `question()`

A wrapper around the [readline](https://nodejs.org/api/readline.html) package.

Usage:

```js
let bear = await question('What kind of bear is best? ')
let token = await question('Choose env variable: ', {
  choices: Object.keys(process.env)
})
```

In second argument, array of choices for Tab autocompletion can be specified.
  
```ts
function question(query?: string, options?: QuestionOptions): Promise<string>
type QuestionOptions = { choices: string[] }
```

### `sleep()`

A wrapper around the `setTimeout` function.

```js
await sleep(1000)
```

### `dotenv()`

Loads environment variables from a `.env` file into `process.env`

```js
await `dotenv()`
await `dotenv({ path: '/custom/path/to/.env' })`
await `dotenv({ override: true })`
```

## Packages

Following packages are available without importing inside scripts.

### `chalk` package

The [chalk](https://www.npmjs.com/package/chalk) package.

```js
console.log(chalk.blue('Hello world!'))
```

### `fs` package

The [fs-extra](https://www.npmjs.com/package/fs-extra) package.

```js
let content = await fs.readFile('./package.json')
```

### `os` package

The [os](https://nodejs.org/api/os.html) package.

```js
await $`cd ${os.homedir()} && mkdir example`
```

### `path` package

The [path](https://nodejs.org/api/path.html) package.

### `yaml` package

The [yaml](https://www.npmjs.com/package/yaml) package.

```js
console.log(yaml.parse('foo: bar').foo)
```

## Configuration
### `$config.verbose`

Echo commands, can be set with `--verbose`. Default is `false`

```js
await $`echo hello`
```

Will print each command as follows

```
echo hello
hello
```

### `$config.quiet`

uppresses all command output if `true`. Default is `false`
### `$config.shell`

Specifies what shell is used. Default is `which bash`.

```js
$config.shell = '/usr/bin/bash'
```

### `$config.shellArg`

Specifies the command that will be prefixed to all commands run.

Default is `set -euo pipefail;`.

### `$config.color`

Default is `true`. `cmru` will add env var `FORCE_COLOR: '1'` to force the subprocess to add color.

## Polyfills 

### `__filename` & `__dirname`

In [ESM](https://nodejs.org/api/esm.html) modules, Node.js does not provide
`__filename` and `__dirname` globals. As such globals are really handy in scripts,
`cmru` provides these for use in `.mjs` files (when using the `cmru` executable).

### `require()`

In [ESM](https://nodejs.org/api/modules.html#modules_module_createrequire_filename)
modules, the `require()` function is not defined.

```js
let {version} = require('./package.json')
```


## Misc

### `argv`

Argv object.

```
cmru -f examples/globals.mjs testArgv
```

```
{
  _: [ 'testArgv' ],
  f: 'examples/globals.mjs',
  file: 'examples/globals.mjs',
  '$0': 'cmru'
}
```