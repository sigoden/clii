# Cmru

Cmru is a build tool using javscript. You write plain js functions, cmru automatically generates subcommands.

![screenshot](https://user-images.githubusercontent.com/4012553/154598176-91ee8666-e67c-4d34-88f5-9191dcf1c30f.png)

- [Cmru](#cmru)
  - [Install](#install)
  - [Quick Start](#quick-start)
  - [Api](#api)
    - [``$`command` ``](#command-)
      - [`ProcessPromise`](#processpromise)
        - [nothrow](#nothrow)
        - [quiet](#quiet)
        - [pipe](#pipe)
        - [kill](#kill)
      - [`ProcessOutput`](#processoutput)
    - [Functions](#functions)
      - [`cd()`](#cd)
      - [`glob()`](#glob)
      - [`fetch()`](#fetch)
      - [`question()`](#question)
      - [`sleep()`](#sleep)
      - [`dotenv()`](#dotenv)
    - [Modules](#modules)
      - [`chalk`](#chalk)
      - [`fs`](#fs)
      - [`os`](#os)
      - [`path`](#path)
      - [`yaml`](#yaml)
      - [`shell`](#shell)
    - [`Configuration`](#configuration)
      - [`verbose`](#verbose)
      - [`quiet`](#quiet-1)
      - [`shell`](#shell-1)
      - [`shellArg`](#shellarg)
      - [`color`](#color)
    - [Polyfills](#polyfills)
      - [`__filename` & `__dirname`](#__filename--__dirname)
      - [`require()`](#require)
    - [Misc](#misc)
      - [`argv`](#argv)
  - [License](#license)

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
  await $`npx serve -l ${settings.port}`;
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

## Api

Cmru provides some handly functions and modules That are available straight away without any imports.

For better autocomplete in editor like vscode. you can manualy import with: 

```js
import 'cmru/globals'
```
or with triple-slash directives.

```js
/// <reference path="<path-to-cmru-module>/dist/globals.d.ts" />
```

### ``$`command` ``

Executes a given string. Idea comes from [`zx`](https://github.com/google/zx)

```js
await $`node --version`
```

Everything passed through `${...}` will be automatically escaped and quoted.

```js
let name = 'foo & bar'
await $`mkdir ${name}`
```

**There is no need to add extra quotes.** Read more about it in 
[quotes](./docs/quotes.md).

You can pass an array of arguments if needed:

```js
let flags = [
  '--oneline',
  '--decorate',
  '--color',
]
await $`git log ${flags}`
```

``$`command` `` returns `ProcessPromise<ProcessOutput>`.

#### `ProcessPromise`

```ts
class ProcessPromise<T> extends Promise<T> {
  readonly stdin: Writable
  readonly stdout: Readable
  readonly stderr: Readable
  readonly exitCode: Promise<number>
  readonly nothrow: this
  readonly quiet: this
  pipe(dest): ProcessPromise<T>
  kill(signal = 'SIGTERM'): Promise<void>
}
```

The return type is a `Promise`.

```js
try {
  await $`exit 1`
} catch (p) {
  console.log(`Exit code: ${p.exitCode}`)
  console.log(`Error: ${p.stderr}`)
}
```

##### nothrow

You can use `nothrow` to catch exitcode other than using `catch`.

```js
  const { exitCode } = await $`exit 1`.nothrow
```

##### quiet

You can use `quiet` to suppress normal output.

```js
const nodeVersion = (await $`node --version`.quiet).stdout.trim();
```

##### pipe

The `pipe()` method can be used to redirect stdout:

```js
await $`cat file.txt`.pipe(process.stdout)
```

##### kill

The `pipe()` method can be used to kill spwan the child process.

```js
let p = $`sleep 9999`.nothrow;
setTimeout(() => {
  p.kill();
}, 5000);
```

Read more about [pipelines](./docs/pipelines.md).

#### `ProcessOutput`

```ts
class ProcessOutput {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
  toString(): string
}
```

### Functions

#### `cd()`

Changes the current working directory.

```js
cd('/tmp')
await $`pwd` // outputs /tmp
```

#### `glob()`

ls files by glob matching.

```js
let packages = await glob(['package.json', 'packages/*/package.json'])
let pictures = await glob('content/*.(jpg|png)')
```
#### `fetch()`

A wrapper around the [node-fetch](https://www.npmjs.com/package/node-fetch) package.

```js
let resp = await fetch('http://wttr.in')
if (resp.ok) {
  console.log(await resp.text())
}
```

#### `question()`

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

#### `sleep()`

A wrapper around the `setTimeout` function.

```js
await sleep(1000)
```

#### `dotenv()`

Loads environment variables from a `.env` file into `process.env`

```js
await `dotenv()`
await `dotenv({ path: '/custom/path/to/.env' })`
await `dotenv({ override: true })`
```

### Modules

Following packages are available without importing inside scripts.

#### `chalk`

The [chalk](https://www.npmjs.com/package/chalk) package.

```js
console.log(chalk.blue('Hello world!'))
```

#### `fs`

The [fs-extra](https://www.npmjs.com/package/fs-extra) package.

```js
let content = await fs.readFile('./package.json')
```

#### `os`

The [os](https://nodejs.org/api/os.html) package.

```js
await $`cd ${os.homedir()} && mkdir example`
```

#### `path`

The [path](https://nodejs.org/api/path.html) package.

#### `yaml`

The [yaml](https://www.npmjs.com/package/yaml) package.

```js
console.log(yaml.parse('foo: bar').foo)
```

#### `shell`

The [shelljs](https://www.npmjs.com/package/shelljs) package.

```js
console.log(shell.which("git"))
```

### `Configuration`

#### `verbose`

Echo commands, can be set with `--verbose`. Default is `false`

```js
await $`echo hello`
```

Will print each command as follows

```
echo hello
hello
```

#### `quiet`

uppresses all command output if `true`. Default is `false`
#### `shell`

Specifies what shell is used. Default is `which bash`.

```js
$config.shell = '/usr/bin/bash'
```

#### `shellArg`

Specifies the command that will be prefixed to all commands run.

Default is `set -euo pipefail;`.

#### `color`

Default is `true`. `cmru` will add env var `FORCE_COLOR: '1'` to force the subprocess to add color.

### Polyfills 

#### `__filename` & `__dirname`

In [ESM](https://nodejs.org/api/esm.html) modules, Node.js does not provide
`__filename` and `__dirname` globals. As such globals are really handy in scripts,
`cmru` provides these for use in `.mjs` files (when using the `cmru` executable).

#### `require()`

In [ESM](https://nodejs.org/api/modules.html#modules_module_createrequire_filename)
modules, the `require()` function is not defined.

```js
let {version} = require('./package.json')
```


### Misc

#### `argv`

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

