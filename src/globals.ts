import { Arguments } from "yargs";
import * as index from "./index";

declare global {
  let $: typeof index.$;
  let $config: typeof index.$config;
  let argv: Arguments<any>;
  // functions
  let cd: typeof index.cd;
  let glob: typeof index.glob;
  let sleep: typeof index.sleep;
  let question: typeof index.question;
  let dotenv: typeof index.dotenv;
  // modules
  let chalk: typeof index.chalk;
  let fs: typeof index.fs;
  let os: typeof index.os;
  let path: typeof index.path;
  let yaml: typeof index.yaml;
  let shell: typeof index.shell;
}
