# Variables

`getvar` make variables overridable by cli options.

`setvar` retrives variable value

```sh
cmru -f examples/variables.js
```

```
Usage: cmru <cmd> [options]

Commands:
  cmru test  Override variables with cli options

Options:
      --version  Show version number                                   [boolean]
  -f, --file     Specific cmru file                [string] [default: "cmru.js"]
  -w, --workdir  Specific working directory                             [string]
      --quiet    Don't echo command                                    [boolean]
      --str      String variable                     [string] [default: "0.1.0"]
      --bool     Boolean variable                     [boolean] [default: false]
      --num      Number variable                           [number] [default: 3]
      --arr      Array variable                            [array] [default: []]
  -h, --help     Show help                                             [boolean]
```

```sh
$ node dist/main.js -f examples/variables.js test --str 1.0.0

str: 1.0.0
bool: false
num: 3
arr: []
```
