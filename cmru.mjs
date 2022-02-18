/**
 * Test with jest
 * @param {string} [args] - Extra jest options
 */
export async function test(args = "") {
  await $`npx jest --detectOpenHandles ${args.split(" ")}`;
}

/**
 * Lint js/ts
 * @param {Object} options
 * @param {boolean} [options.fix] - Fix lint error
 */
export async function lint(options = {}) {
  const args = [];
  if (options.fix) {
    args.push("--fix");
  }
  await $`npx eslint . ${args}`;
}
