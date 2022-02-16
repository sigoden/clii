#!/usr/bin/env cmru -f

/**
 * one parameter
 * @param {string} foo
 */
export function task1(foo) {
  console.log(foo);
}

/**
 * parameter with default value
 * @param {string} [foo]
 */
export function task2(foo = "master@example.com") {
  console.log(foo);
}

/**
 * array parameter
 * @param {string[]} files
 */
export function task3(files) {
  console.log(files);
}

/**
 * multiple parameters
 * @param {string} foo
 * @param {string[]} bars
 */
export function task4(foo, bars) {
  console.log(`${foo} ${bars}`);
}
