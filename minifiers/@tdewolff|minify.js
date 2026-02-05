// @ts-check
import { minify as tdewolffMinify } from "@tdewolff/minify";
import { minify } from "../minify.js";

minify((code) => tdewolffMinify("application/javascript", code));
