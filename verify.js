// @ts-check
import "global-jsdom/register";

/** @typedef {{ [key: string]: Function | Elm }} Elm */

class KnownError extends Error {}

async function run() {
  const [, , file, warnAboutFlags = "false", ...restArgs] = process.argv;

  if (file === undefined) {
    throw new KnownError(
      `Expected the .js file to verify as the first argument.`,
    );
  }

  if (restArgs.length > 0) {
    throw new KnownError(
      `Expected a single argument, but got ${restArgs.length} extra: ${JSON.stringify(restArgs)}`,
    );
  }

  await import(file);
  /** @type {Elm | undefined} */
  const Elm = /** @type {any} */ (window).Elm;
  if (
    Elm === undefined ||
    Elm === null ||
    Array.isArray(Elm) ||
    typeof Elm !== "object"
  ) {
    throw new KnownError(`Bad window.Elm: ${Elm}`);
  }
  initAllElmApps(warnAboutFlags === "true", ["Elm"], Elm);
}

/**
 * @param {boolean} warnAboutFlags
 * @param {Array<string>} namespace
 * @param {Elm} Elm
 */
function initAllElmApps(warnAboutFlags, namespace, Elm) {
  for (const [key, value] of Object.entries(Elm)) {
    const nextNamespace = [...namespace, key];
    if (typeof value === "function") {
      const node = document.createElement("x-elm-minification-benchmarks");
      document.body.append(node);
      try {
        value({ node });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes(
            "https://github.com/elm/core/blob/1.0.0/hints/2.md",
          )
        ) {
          if (warnAboutFlags) {
            console.warn(
              "The Elm program depends on automatic flag decoding, cannot test fully that the code runs after minification.",
            );
          }
          continue;
        } else {
          throw error;
        }
      }
      if (document.body.contains(node)) {
        throw new KnownError(
          `${nextNamespace.join(".")} did not render properly:\n${document.body.outerHTML}`,
        );
      }
    } else {
      initAllElmApps(warnAboutFlags, nextNamespace, value);
    }
  }
}

run().catch((error) => {
  console.error(error instanceof KnownError ? error.message : error);
  process.exitCode = 1;
});
