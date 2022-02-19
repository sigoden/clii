import cmru from "cmru";

cmru(import.meta.url);

export const settings = {
  // Default port number
  port: 3000,
};

// A command
export async function cmd1() {
  console.log(`listening on http://localhost:${settings.port}`);
}

/**
 * Another command
 * @param {Object} options
 * @param {number} options.num - Num variable
 * @param {("prod"|"dev"|"stage")} options.mode - Build mode
 * @param {string} message - Positional param
 */
export async function cmd2(options, message) {
  console.log(JSON.stringify({ options, message }));
}

export default function () {
  console.log("invoke without arguments");
}
