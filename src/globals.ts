import { registerGlobals } from "./index";
import {
  $,
  cd as _cd,
  fetch as _fetch,
  question as _question,
  sleep as _sleep,
  dotenv as _dotenv,
  chalk as _chalk,
  fs as _fs,
  globby as _globby,
  os as _os,
  path as _path,
  glob as _glob,
} from "./index";

declare global {
  let $: $;

  let cd: typeof _cd;
  // let fetch: typeof _fetch;
  let question: typeof _question;
  let sleep: typeof _sleep;
  let dotenv: typeof _dotenv;

  let chalk: typeof _chalk;
  let fs: typeof _fs;
  let globby: typeof _globby;
  let os: typeof _os;
  let path: typeof _path;

  let glob: typeof _glob;
}

registerGlobals();
