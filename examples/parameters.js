#!/usr/bin/env cmru --cmrufile

/**
 * command parameter
 * @param {string} pattern
 */
export function filter(pattern) {
  console.log(pattern);
}

/**
 * command parameter with default value
 * @param {string} address
 */
export function email(address = "master@example.com") {
  console.log(address);
}

/**
 * command parameter with one or more values
 * @param {string[]} files
 */
export function backup(files) {
  console.log(`scp ${files.join(" ")} me@example.com`);
}

/**
 * multiple command parameters
 * @param {string} message
 * @param {string[]} flags
 */
export function commit(messgae, flags) {
  console.log(`git commit ${flags.join(" ")} ${messgae}`);
}
