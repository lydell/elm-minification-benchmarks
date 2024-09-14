// @ts-check
import * as terser from "terser";
import { minify } from "../minify.js";

minify(async (code) => {
  const result = await terser.minify(code);

  if (result.code === undefined) {
    throw new Error("terser: No output code");
  }

  return result.code;
});
