#!/usr/bin/env clii -f

export const settings = {
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
 * Override settings with cli options
 */
export default function () {
  console.log(settings);
}
