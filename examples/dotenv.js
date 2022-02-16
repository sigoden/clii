#!/usr/bin/env cmru -f

dotenv();

export function main() {
  console.log(process.env.FOO);
  console.log(process.env.BAR);
}
