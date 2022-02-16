#!/usr/bin/env cmru -f

setvar("ver", "0.1.0", "Binary version");

/**
 * Override variables from cli with --ver
 */
export function test() {
  console.log(getvar("ver"));
}
