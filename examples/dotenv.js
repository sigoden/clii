#!/usr/bin/env cmru -f

dotenv();

// default command
export default async function () {
  await $`echo ${process.env.FOO}`;
  await $`echo ${process.env.BAR}`;
}
