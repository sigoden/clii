import { registerGlobals } from "./index";
import {
  $,
  dotenv as _dotenv,
  cd as _cd,
  chalk as _chalk,
  fetch as _fetch,
  fs as _fs,
  glob as _glob,
  globby as _globby,
  nothrow as _nothrow,
  os as _os,
  path as _path,
  question as _question,
  sleep as _sleep,
} from "./index";

declare global {
  let $: $;
  let dotenv: typeof _dotenv;
  let cd: typeof _cd;
  let chalk: typeof _chalk;
  // let fetch: typeof _fetch;
  let fs: typeof _fs;
  let glob: typeof _glob;
  let globby: typeof _globby;
  let nothrow: typeof _nothrow;
  let os: typeof _os;
  let path: typeof _path;
  let question: typeof _question;
  let sleep: typeof _sleep;
}

registerGlobals();
