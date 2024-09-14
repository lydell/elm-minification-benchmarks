// @ts-check
import * as esbuild from "esbuild";
import { minify } from "../minify.js";

minify(
  async (code) =>
    (
      await esbuild.transform(code, {
        minify: true,
      })
    ).code,
);
