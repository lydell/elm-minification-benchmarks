// @ts-check
import * as esbuild from "esbuild";
import * as uglify from "uglify-js";
import { minify } from "../minify.js";

const disableDefaultOptions = Object.fromEntries(
  Object.entries(
    // @ts-expect-error: `default_options` seems to be missing in the type definition.
    uglify.default_options().compress,
  ).map(([key, value]) => [key, value === true ? false : value]),
);

export const pureFuncs = [
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

/**
 * Source: https://discourse.elm-lang.org/t/what-i-ve-learned-about-minifying-elm-code/7632
 *
 * @type {import("uglify-js").MinifyOptions}
 */
export const options = {
  compress: {
    ...disableDefaultOptions,
    pure_funcs: pureFuncs,
    pure_getters: true,
    strings: true,
    sequences: true,
    merge_vars: true,
    switches: true,
    dead_code: true,
    if_return: true,
    inline: true,
    join_vars: true,
    reduce_vars: true,
    side_effects: true,
    conditionals: true,
    collapse_vars: true,
    unused: true,
  },
  mangle: false,
};

minify(async (code) => {
  const result = uglify.minify(code, options);

  if (result.error !== undefined) {
    throw result.error;
  }

  return (
    await esbuild.transform(result.code, {
      minify: true,
      target: "es5",
    })
  ).code;
});
