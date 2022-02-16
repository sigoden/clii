#!/usr/bin/env cmru -f

// String variable
export let str = "0.1.0";
// Boolean variable
export let bool = false;
// Number variable
export let num = 3;
// Array varialbe
export let arr = [];

/**
 * Override variables with cli options
 */
export function test() {
  console.log("str:", str);
  console.log("bool:", bool);
  console.log("num:", num);
  console.log("arr:", arr);
}
