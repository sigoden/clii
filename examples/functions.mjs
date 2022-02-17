#!/usr/bin/env cmru -f

/**
 * One parameter
 * @param {string} foo - Positional param
 */
export function task1(foo) {
  console.log(foo);
}

/**
 * Parameter with default value
 * @param {string} [foo] - Optional positional param
 */
export function task2(foo = "master@example.com") {
  console.log(foo);
}

/**
 * Array parameter
 * @param {string[]} arr - Array positional param
 */
export function task3(arr) {
  console.log(arr);
}

/**
 * Multiple parameters
 * @param {string} foo - First positonal param
 * @param {string[]} bars - Second array postional param
 */
export function task4(foo, bars) {
  console.log(`${foo} ${bars}`);
}

/**
 * Command with options
 * @param {Object} options
 * @param {string} options.foo - option foo
 * @param {string} options.bar - option bar
 */
export function task5(options) {
  console.log(options);
}

/**
 * Both parameters and options
 * @param {Object} options
 * @param {string} options.foo - Option foo
 * @param {number} options.bar - Option bar
 * @param {string} pos - Positional param
 */
export function task6(options, pos) {
  console.log(options, pos);
}
