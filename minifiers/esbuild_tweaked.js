// @ts-check
import * as esbuild from "esbuild";
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

minify(
  async (code) =>
    (
      await esbuild.transform(removeIIFE(code), {
        minify: true,
        pure: pureFuncs,
        target: "es5",
        format: "iife",
      })
    ).code,
);

/**
 * @param {string} code
 * @returns {string}
 */
function removeIIFE(code) {
  return `var scope = window;${code.slice(
    code.indexOf("{") + 1,
    code.lastIndexOf("}"),
  )}`;
}
