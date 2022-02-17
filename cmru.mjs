/**
 * Test with jest
 * @param {string} [args] - Extra jest options
 */
export async function test(args = "") {
  await $`npx jest --detectOpenHandles ${args.split(" ")}`;
}

/**
 * Lint js/ts
 * @param {Object} [options]
 * @param {boolean} [options.fix] - Fix lint error
 */
export async function lint(options = {}) {
  const args = [];
  if (options.fix) {
    args.push("--fix");
  }
  await $`npx eslint . ${args}`;
}

/**
 * Commit git message after lint
 * @param {string} message - Commit message
 * @param {string} [args] - Extra git commit options
 */
export async function commit(message, args = "") {
  await lint();
  await $`git commit ${args.split(" ")} -m ${message}`;
}
