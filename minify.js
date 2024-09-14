// @ts-check
import * as fs from "node:fs";
import * as zlib from "node:zlib";

/**
 * @typedef {{
     time: number,
     size: number,
     brotliSize: number
   }} Stats
 *
 * @typedef {(code: string, inputFile: string) => string | Promise<string>} RunMinifier
 */

class KnownError extends Error {}

/**
 * @param {RunMinifier} runMinifier
 */
export async function minify(runMinifier) {
  minifyHelper(runMinifier).catch((error) => {
    console.error(error instanceof KnownError ? error.message : error);
    process.exitCode = 1;
  });
}

/**
 * @param {RunMinifier} runMinifier
 */
export async function minifyHelper(runMinifier) {
  const [, , inputFile, outputFile, ...restArgs] = process.argv;

  if (inputFile === undefined) {
    throw new KnownError(
      `Expected the input .js file to minify as the first argument.`,
    );
  }

  if (outputFile === undefined) {
    throw new KnownError(
      `Expected the output .js file to put the minified code into as the second argument.`,
    );
  }

  if (restArgs.length > 0) {
    throw new KnownError(
      `Expected two arguments, but got ${restArgs.length} extra: ${JSON.stringify(restArgs)}`,
    );
  }

  const code = fs.readFileSync(inputFile, "utf8");
  const start = Date.now();
  const minified = await runMinifier(code, inputFile);
  const elapsed = Date.now() - start;

  /** @type {Stats} */
  const stats = {
    time: elapsed,
    size: Buffer.byteLength(minified),
    brotliSize: zlib.brotliCompressSync(minified).byteLength,
  };

  fs.writeFileSync(outputFile, minified);
  fs.writeFileSync(`${outputFile}.json`, JSON.stringify(stats, null, 2) + "\n");
}
