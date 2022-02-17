// This is options
export let options = {
  // Option foo
  foo: "foo",
};

// This is task1
export async function task1() {
  await $`pwd`;
}

/**
 * This is task2 with parameters
 * @param {string} bar - Argument bar
 */
export async function task2(bar) {
  await $`echo ${options.foo} ${bar}`;
}
