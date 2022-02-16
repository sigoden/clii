#!/usr/bin/env cmru -f

setvar("str", "0.1.0", "String variable");
setvar("bool", false, "Boolean variable");
setvar("num", 3, "Number variable");
setvar("arr", [], "Array variable");

/**
 * Override variables with cli options
 */
export function test() {
  console.log("str:", getvar("str"));
  console.log("bool:", getvar("bool"));
  console.log("num:", getvar("num"));
  console.log("arr:", getvar("arr"));
}
