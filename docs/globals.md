# Globals

> `cmru` globals refer to [`zx`](https://github.com/google/zx)

All functions ($, cd, fetch, etc) are available straight away without any imports.

Or import globals explicitly (for better autocomplete in VS Code).

```js
import 'cmru/globals'
```

## ``$`command` ``

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

### `ProcessPromise`

```ts
class ProcessPromise<T> extends Promise<T> {
  readonly stdin: Writable
  readonly stdout: Readable
  readonly stderr: Readable
  readonly exitCode: Promise<number>
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

### `nothrow()`

Changes behavior of `$` to not throw an exception on non-zero exit codes.

```ts
function nothrow<P>(p: P): P
```

Usage:

```js
await nothrow($`grep something from-file`)

// Inside a pipe():

await $`find ./examples -type f -print0`
  .pipe(nothrow($`xargs -0 grep something`))
  .pipe($`wc -l`)
```

If only the `exitCode` is needed, you can use the next code instead:

```js
if (await $`[[ -d path ]]`.exitCode == 0) {
  ...
}

// Equivalent of:

if ((await nothrow($`[[ -d path ]]`)).exitCode == 0) {
  ...
}
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

### `globby` package

The [globby](https://github.com/sindresorhus/globby) package.

```js
let packages = await globby(['package.json', 'packages/*/package.json'])

let pictures = globby.globbySync('content/*.(jpg|png)')
```

Also, globby available via the `glob` shortcut:

```js
await $`svgo ${await glob('*.svg')}`
```

### `os` package

The [os](https://nodejs.org/api/os.html) package.

```js
await $`cd ${os.homedir()} && mkdir example`
```

### `path` package

The [path](https://nodejs.org/api/path.html) package.

```js
await $`mkdir ${path.join(basedir, 'output')}`
```

## Configuration

### `$.shell`

Specifies what shell is used. Default is `which bash`.

```js
$.shell = '/usr/bin/bash'
```

Or use a CLI argument: `--shell=/bin/bash`

### `$.prefix`

Specifies the command that will be prefixed to all commands run.

Default is `set -euo pipefail;`.

Or use a CLI argument: `--prefix='set -e;'`

### `$.quote`

Specifies a function for escaping special characters during 
command substitution.

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

