// @ts-check
import * as swc from "@swc/core";
import { minify } from "../minify.js";

minify(async (code) => (await swc.minify(code)).code);
