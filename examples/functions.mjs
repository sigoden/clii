#!/usr/bin/env clii -f

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
export const task2 = (foo = "master@example.com") => {
  console.log(foo);
};

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
 * @param {string} options.str - String option
 * @param {number} options.num - Number option
 * @param {boolean} options.bool - Number option
 * @param {string[]} options.arr - Array option
 */
export function task5(options) {
  console.log(JSON.stringify(options));
}

/**
 * Both parameters and options
 * @param {Object} options
 * @param {string} options.foo - Option foo
 * @param {number} options.bar - Option bar
 * @param {string} pos - Positional param
 */
export function task6(options, pos) {
  console.log(JSON.stringify({ options, pos }));
}

/**
 * Parameter with chooices
 * @param {Object} options
 * @param {("x"|"y"|"z")} options.select - Double quotes
 * @param {('dev'|'prod'|'stage')} pos1 - Single quotes
 * @param {(1|2|3)} pos2 - Number enums
 */
export function task7(options, pos1, pos2) {
  console.log(JSON.stringify({ options, pos1, pos2 }));
}

/**
 * Without param comment
 */
export function task8(...args) {
  console.log(args);
}

/**
 * Access global argv
 */
export function task9() {
  console.log(argv._);
}
