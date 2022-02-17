#!/usr/bin/env cmru -f

export const options = {
  // String variable
  str: "0.1.0",
  // Boolean variable
  bool: false,
  // Number variable
  num: 3,
  // Array varialbe
  arr: [],
};

/**
 * Override variables with cli options
 */
export default function () {
  console.log(options);
}
