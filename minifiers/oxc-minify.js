// @ts-check
import { minify } from "../minify.js";
import * as oxc from "oxc-minify";

minify((code) => oxc.minify("file.js", code).code);
