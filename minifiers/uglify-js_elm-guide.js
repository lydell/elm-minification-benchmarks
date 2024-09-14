// @ts-check
import * as uglify from "uglify-js";
import { minify } from "../minify.js";

const pureFuncs = [
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
  "A7",
  "A8",
  "A9",
];

minify((code) => {
  const result = uglify.minify(code, {
    compress: {
      pure_funcs: pureFuncs,
      pure_getters: true,
      unsafe_comps: true,
      unsafe: true,
    },
    mangle: {
      reserved: pureFuncs,
    },
  });

  if (result.error !== undefined) {
    throw result.error;
  }

  return result.code;
});
