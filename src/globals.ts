import * as index from "./index";

declare global {
  let $: typeof index.$;
  let $config: typeof index.$config;
  // functions
  let cd: typeof index.cd;
  let ls: typeof index.ls;
  let which: typeof index.which;
  let sleep: typeof index.sleep;
  let question: typeof index.question;
  let dotenv: typeof index.dotenv;
  // modules
  let chalk: typeof index.chalk;
  let fs: typeof index.fs;
  let os: typeof index.os;
  let path: typeof index.path;
}
