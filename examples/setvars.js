#!/usr/bin/env cmru --cmrufile

export let setvars = {
  version: "0.1.0",
  tardir: "awesomesauce-" + version,
  tarball: tardir + ".tar.gz",
};

/**
 * override variables from just command line. cmru --set version 1.0.0
 */
export function test() {
  console.log(setvars.version);
}
