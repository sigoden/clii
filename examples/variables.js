#!/usr/bin/env cmru -f

setvar("ver", "0.1.0", "Binary version");

/**
 * override variables from just command line.
 */
export function main() {
  console.log(getvar("ver"));
}
