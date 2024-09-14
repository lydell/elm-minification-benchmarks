// @ts-check
import * as path from "node:path";
import * as childProcess from "node:child_process";
import { minify } from "../minify.js";

minify((_code, inputFile) => {
  const result = childProcess.spawnSync(
    path.join(import.meta.dirname, "..", "node_modules", ".bin", "bun"),
    ["build", "--minify", inputFile],
    {
      encoding: "utf8",
    },
  );
  if (result.error) {
    throw result.error;
  }
  const exitCode =
    result.signal !== null ? result.signal + 128 : (result.status ?? -1);
  if (exitCode !== 0) {
    throw new Error(
      `bun failed: ${exitCode}\n\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout;
});
