import { $config, colorize } from "./index";
import { ChildProcess, spawn } from "child_process";
import { promisify, inspect } from "util";
import chalk, { ChalkInstance } from "chalk";
import psTreeModule from "ps-tree";

const psTree = promisify(psTreeModule);

export function $(
  pieces: TemplateStringsArray,
  ...args: any[]
): ProcessPromise<ProcessOutput> {
  const __from = new Error().stack?.split(/^\s*at\s/m)[2].trim() || "";

  let cmd = pieces[0],
    i = 0;
  while (i < args.length) {
    let s;
    if (Array.isArray(args[i])) {
      s = args[i].map((x: any) => quote(substitute(x))).join(" ");
    } else {
      s = quote(substitute(args[i]));
    }
    cmd += s + pieces[++i];
  }

  let resolve: (v: any) => any, reject: (v: any) => any;
  const promise = new ProcessPromise<ProcessOutput>(
    (...args) => ([resolve, reject] = args)
  );

  promise._run = () => {
    if (promise.child) return;
    if (promise._prerun) promise._prerun();
    if (!promise._quiet && $config.verbose) {
      printCmd(cmd);
    }

    const child = spawn($config.shellArg + cmd, {
      cwd: process.cwd(),
      shell: $config.shell ? $config.shell : true,
      stdio: [promise._inheritStdin ? "inherit" : "pipe", "pipe", "pipe"],
      windowsHide: true,
      env: $config.color ? { ...process.env, FORCE_COLOR: "1" } : process.env,
    });

    child.on("exit", (code_) => {
      child.on("close", () => {
        const code = code_ || 0;
        const output = new ProcessOutput({
          code,
          stdout,
          stderr,
          combined,
          message:
            `${stderr || "\n"}    at ${__from}\n    exit code: ${code}` +
            (exitCodeInfo(code) ? " (" + exitCodeInfo(code) + ")" : ""),
        });
        (code === 0 || promise._nothrow ? resolve : reject)(output);
        promise._resolved = true;
      });
    });

    let stdout = "",
      stderr = "",
      combined = "";
    const onStdout = (data: string) => {
      if (!promise._quiet) process.stdout.write(data);
      stdout += data;
      combined += data;
    };
    const onStderr = (data: string) => {
      if (!promise._quiet) process.stderr.write(data);
      stderr += data;
      combined += data;
    };
    if (!promise._piped) child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    promise.child = child;
    if (promise._postrun) promise._postrun();
  };
  setTimeout(promise._run, 0); // Make sure all subprocesses started.
  return promise;
}

export class ProcessPromise<T> extends Promise<T> {
  public child?: ChildProcess;
  public _resolved = false;
  public _inheritStdin = true;
  public _piped = false;
  public _prerun?: () => void;
  public _postrun?: () => void;
  public _run = () => {};
  public _nothrow = false;
  public _quiet = $config.quiet;

  get stdin() {
    this._inheritStdin = false;
    this._run();
    return this.child!.stdin!;
  }

  get stdout() {
    this._inheritStdin = false;
    this._run();
    return this.child!.stdout!;
  }

  get stderr() {
    this._inheritStdin = false;
    this._run();
    return this.child!.stderr!;
  }

  get exitCode(): Promise<number> {
    return this.then<any>((p: any) => p.exitCode).catch((p) => p.exitCode);
  }

  get nothrow() {
    this._nothrow = true;
    return this;
  }

  get quiet() {
    this._quiet = true;
    return this;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ) {
    if (this._run) this._run();
    return super.then(onfulfilled, onrejected);
  }

  pipe(dest: ProcessPromise<T>) {
    if (typeof dest === "string") {
      throw new Error("The pipe() method does not take strings. Forgot $?");
    }
    if (this._resolved === true) {
      throw new Error(
        "The pipe() method shouldn't be called after promise is already resolved!"
      );
    }
    this._piped = true;
    if (dest instanceof ProcessPromise) {
      dest._inheritStdin = false;
      dest._prerun = this._run;
      dest._postrun = () => this.stdout.pipe(dest.child!.stdin!);
      return dest;
    } else {
      this._postrun = () => this.stdout.pipe(dest);
      return this;
    }
  }

  async kill(signal = "SIGTERM") {
    this.catch((_) => _);
    const pid = this.child.pid;
    const children = await psTree(pid);
    for (const p of children) {
      try {
        process.kill(parseInt(p.PID), signal);
      } catch (e) {}
    }
    try {
      process.kill(pid, signal);
    } catch (e) {}
  }
}

interface ProcessOutputArgs {
  code: number;
  stdout: string;
  stderr: string;
  combined: string;
  message: string;
}

export class ProcessOutput extends Error {
  #code = 0;
  #stdout = "";
  #stderr = "";
  #combined = "";

  constructor({ code, stdout, stderr, combined, message }: ProcessOutputArgs) {
    super(message);
    this.#code = code;
    this.#stdout = stdout;
    this.#stderr = stderr;
    this.#combined = combined;
  }

  toString() {
    return this.#combined;
  }

  get stdout() {
    return this.#stdout;
  }

  get stderr() {
    return this.#stderr;
  }

  get exitCode() {
    return this.#code;
  }

  [inspect.custom]() {
    const stringify = (s: string, c: ChalkInstance, beautify = false) => {
      if (s.length === 0) {
        return "''";
      }
      const o = beautify ? inspect(s) : s;
      return $config.color ? c(o) : o;
    };
    return `ProcessOutput {
  stdout: ${stringify(this.stdout, chalk.green, true)},
  stderr: ${stringify(this.stderr, chalk.red, true)},
  exitCode: ${stringify(
    "" + this.exitCode,
    this.exitCode === 0 ? chalk.green : chalk.red
  )}${
      exitCodeInfo(this.exitCode)
        ? stringify(" (" + exitCodeInfo(this.exitCode) + ")", chalk.gray)
        : ""
    }
}`;
  }
}

function printCmd(cmd: string) {
  if (/\n/.test(cmd)) {
    console.log(
      cmd
        .split("\n")
        .map((line, i) => (i === 0 ? "$" : ">") + " " + colorize(line))
        .join("\n")
    );
  } else {
    console.log("$", colorize(cmd));
  }
}

function substitute(arg: ProcessOutput | string) {
  if (arg instanceof ProcessOutput) {
    return arg.stdout.replace(/\n$/, "");
  }
  return `${arg}`;
}

function quote(arg: string) {
  if (/^[a-z0-9/_.-]+$/i.test(arg) || arg === "") {
    return arg;
  }
  return (
    `$'` +
    arg
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\f/g, "\\f")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/\v/g, "\\v")
      .replace(/\0/g, "\\0") +
    `'`
  );
}

function exitCodeInfo(exitCode: number) {
  return {
    2: "Misuse of shell builtins",
    126: "Invoked command cannot execute",
    127: "Command not found",
    128: "Invalid exit argument",
    129: "Hangup",
    130: "Interrupt",
    131: "Quit and dump core",
    132: "Illegal instruction",
    133: "Trace/breakpoint trap",
    134: "Process aborted",
    135: 'Bus error: "access to undefined portion of memory object"',
    136: 'Floating point exception: "erroneous arithmetic operation"',
    137: "Kill (terminate immediately)",
    138: "User-defined 1",
    139: "Segmentation violation",
    140: "User-defined 2",
    141: "Write to pipe with no one reading",
    142: "Signal raised by alarm",
    143: "Termination (request to terminate)",
    145: "Child process terminated, stopped (or continued*)",
    146: "Continue if stopped",
    147: "Stop executing temporarily",
    148: "Terminal stop signal",
    149: 'Background process attempting to read from tty ("in")',
    150: 'Background process attempting to write to tty ("out")',
    151: "Urgent data available on socket",
    152: "CPU time limit exceeded",
    153: "File size limit exceeded",
    154: 'Signal raised by timer counting virtual time: "virtual timer expired"',
    155: "Profiling timer expired",
    157: "Pollable event",
    159: "Bad syscall",
  }[exitCode];
}
