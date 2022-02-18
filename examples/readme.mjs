export const settings = {
  // Default port number
  port: 3000,
};

// A command
export async function cmd1() {
  await $`npx serve -l ${settings.port}`;
}

/**
 * Another command
 * @param {Object} options
 * @param {string} options.foo - Option foo
 * @param {number} options.bar - Option bar
 * @param {string} message - Positional param
 */
export async function cmd2(options, message) {
  console.log(JSON.stringify({ options, message }));
}

export default function () {
  console.log("no arguments invoke default function");
}
