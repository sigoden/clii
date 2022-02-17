import { registerGlobals } from "./index";
import {
  $ as $_,
  $config as $config_,
  cd as _cd,
  ls as _ls,
  which as _which,
  fetch as _fetch,
  question as _question,
  sleep as _sleep,
  dotenv as _dotenv,
  chalk as _chalk,
  fs as _fs,
  os as _os,
  path as _path,
} from "./index";

declare global {
  let $: typeof $_;
  let $config: typeof $config_;
  let cd: typeof _cd;
  let ls: typeof _ls;
  let which: typeof _which;
  // let fetch: typeof _fetch;
  let question: typeof _question;
  let sleep: typeof _sleep;
  let dotenv: typeof _dotenv;
  let chalk: typeof _chalk;
  let fs: typeof _fs;
  let os: typeof _os;
  let path: typeof _path;
}

registerGlobals();
