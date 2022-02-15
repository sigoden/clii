#!/usr/bin/env cmru --cmrufile

/**
 * execute sequence: a -> f1 -> b -> c
 */
export function f1() {
  console.log("f1");
}
f1.deps = ["a", "$", "b", "c"];

/**
 * execute sequence with args: c -> d() -> f2
 */
export function f2() {
  console.log("f2");
}
f2.deps = ["c", ["d", "oo"]];

export function a() {
  console.log("a");
}

export function b() {
  console.log("b");
}

export function c() {
  console.log("c");
}

export function d(v) {
  console.log(`d: ${v}`);
}
