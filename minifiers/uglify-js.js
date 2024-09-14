// @ts-check
import * as uglify from "uglify-js";
import { minify } from "../minify.js";

minify((code) => {
  const result = uglify.minify(code);

  if (result.error !== undefined) {
    throw result.error;
  }

  return result.code;
});
