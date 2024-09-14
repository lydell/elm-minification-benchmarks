// @ts-check
// @ts-expect-error There are no types for this package.
import * as tdewolff from "@tdewolff/minify";
import { minify } from "../minify.js";

minify((code) => tdewolff.string("application/javascript", code));
