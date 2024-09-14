// @ts-check
import * as terser from "terser";
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

minify(async (code) => {
  const result = await terser.minify(code, {
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

  if (result.code === undefined) {
    throw new Error("terser: No output code");
  }

  return result.code;
});
