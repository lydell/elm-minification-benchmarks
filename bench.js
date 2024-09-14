// @ts-check
import * as fs from "node:fs";
import * as path from "node:path";
import * as childProcess from "child_process";

const OUTPUT = path.join(import.meta.dirname, "output");
const MINIFIERS = path.join(import.meta.dirname, "minifiers");

class KnownError extends Error {}

async function run() {
  const [, , elmFile, ...restArgs] = process.argv;

  if (elmFile === undefined) {
    throw new KnownError(
      `Expected the compiled Elm .js file as the only argument.`,
    );
  }

  if (restArgs.length > 0) {
    throw new KnownError(
      `Expected a single argument, but got ${restArgs.length} extra: ${JSON.stringify(restArgs)}`,
    );
  }

  try {
    const stat = fs.statSync(elmFile);
    if (!stat.isFile()) {
      throw new KnownError(`The passed path is not file.`);
    }
  } catch (error) {
    throw new KnownError(
      `Problem with the passed file: ${error instanceof Error ? error.message : error}`,
    );
  }

  const contents = fs.readFileSync(elmFile, "utf8");
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT, { recursive: true });
  const inputFile = path.join(OUTPUT, "elm.js");
  fs.writeFileSync(
    inputFile,
    contents.replace(/\(this\)\);\s*$/, "(window));"),
  );

  await verify(true, inputFile);

  const minifierFiles = fs
    .readdirSync(MINIFIERS)
    .sort()
    .map((file) => ({
      name: file.replace(".js", "").replace("|", "/"),
      minifierFile: path.join(MINIFIERS, file),
      outputFile: path.join(OUTPUT, file),
      outputJsonFile: path.join(OUTPUT, file) + ".json",
    }));
  process.stderr.write(
    minifierFiles.map(({ name }) => `⚪️ ${name}`).join("\n") + "\n",
  );

  /** @type {Array<[string, Error]>} */
  const verificationErrors = [];

  for (const [
    index,
    { name, minifierFile, outputFile },
  ] of minifierFiles.entries()) {
    const distance = minifierFiles.length - index;

    /**
     * @param {string} status
     */
    const writeStatus = (status) => {
      process.stderr.moveCursor(0, -distance);
      process.stderr.write(status);
      process.stderr.moveCursor(0, distance);
      process.stderr.cursorTo(0);
    };

    writeStatus("⏳");
    try {
      await minify(minifierFile, inputFile, outputFile);
      await verify(false, outputFile);
    } catch (error) {
      if (error instanceof Error) {
        verificationErrors.push([name, error]);
      } else {
        throw error;
      }
      writeStatus("🔴");
      continue;
    }
    writeStatus("🟢");
  }

  process.stderr.moveCursor(0, -minifierFiles.length);
  process.stderr.clearScreenDown();

  console.table(makeTable(minifierFiles));
  for (const [name, error] of verificationErrors) {
    console.error(`### ${name} error`);
    console.error(error);
  }
}

/**
 * @param {boolean} warnAboutFlags
 * @param {string} file
 */
async function verify(warnAboutFlags, file) {
  return fork(
    "Verification script",
    path.join(import.meta.dirname, "verify.js"),
    [file, warnAboutFlags.toString()],
  );
}

/**
 * @param {string} minifierFile
 * @param {string} inputFile
 * @param {string} outputFile
 */
async function minify(minifierFile, inputFile, outputFile) {
  return fork(
    `Minification script ${path.basename(minifierFile)}`,
    minifierFile,
    [inputFile, outputFile],
  );
}

/**
 * @param {string} description
 * @param {string} file
 * @param {Array<string>} args
 */
async function fork(description, file, args) {
  return new Promise((resolve, reject) => {
    /** @type {Array<Buffer>} */
    const stdout = [];
    /** @type {Array<Buffer>} */
    const stderr = [];
    const child = childProcess.fork(file, args, {
      // Silence deprecation warning of punycode via jsdom.
      execArgv: ["--no-deprecation"],
      stdio: "pipe",
    });
    child.stdout?.on("data", (data) => {
      stdout.push(data);
    });
    child.stderr?.on("data", (data) => {
      stderr.push(data);
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      const exitCode = signal !== null ? signal + 128 : (code ?? -1);
      if (exitCode !== 0) {
        reject(
          new KnownError(
            `${description} failed: ${exitCode}\n\n${Buffer.concat([...stdout, ...stderr]).toString()}`,
          ),
        );
      } else {
        resolve(undefined);
      }
    });
  });
}

/**
 * @param {Array<{
    name: string,
    minifierFile: string,
    outputFile: string,
    outputJsonFile: string,
  }>} minifierFiles
 * @returns {Array<Record<string, unknown>>}
 */
function makeTable(minifierFiles) {
  const [baseline, ...minifierOutputs] = minifierFiles
    .filter(({ outputJsonFile }) => fs.existsSync(outputJsonFile))
    .map(({ name, outputJsonFile }) => {
      /** @type {import("./minify.js").Stats} */
      const stats = JSON.parse(fs.readFileSync(outputJsonFile, "utf8"));
      return {
        name,
        ...stats,
      };
    });

  if (baseline === undefined) {
    throw new KnownError("Missing output files.");
  }

  minifierOutputs.sort(
    (a, b) => a.brotliSize - b.brotliSize || a.size - b.size || a.time - b.time,
  );

  const fastest = Math.min(...minifierOutputs.map(({ time }) => time));
  const smallestSize = Math.min(...minifierOutputs.map(({ size }) => size));
  const smallestBrotliSize = Math.min(
    ...minifierOutputs.map(({ brotliSize }) => brotliSize),
  );

  return [baseline, ...minifierOutputs].map(
    ({ name, time, size, brotliSize }) => {
      const isBaseline = name === baseline.name;
      const packageName =
        isBaseline || name.includes("+") ? undefined : name.split("_")[0];
      const version =
        packageName === undefined
          ? ""
          : JSON.parse(
              fs.readFileSync(
                path.join(
                  import.meta.dirname,
                  "node_modules",
                  packageName,
                  "package.json",
                ),
                "utf8",
              ),
            ).version;

      return {
        name,
        version,
        time: isBaseline ? "" : winner(time, fastest) + printDurationMs(time),
        x: isBaseline ? "" : `x${(time / fastest).toFixed(0)}`,
        size: winner(size, smallestSize) + printFileSize(size),
        "%": isBaseline ? "" : percentageChange(size, baseline.size),
        "brotli ⬇":
          winner(brotliSize, smallestBrotliSize) + printFileSize(brotliSize),
        "% ": isBaseline
          ? ""
          : percentageChange(brotliSize, baseline.brotliSize),
        "installation size and dependencies":
          packageName === undefined
            ? ""
            : `https://packagephobia.com/result?p=${packageName}`,
      };
    },
  );
}

const KiB = 1024;
const MiB = 1048576;

/**
 *
 * @param {number} fileSize
 * @returns {string}
 */
function printFileSize(fileSize) {
  const [divided, unit] =
    fileSize >= MiB ? [fileSize / MiB, "MiB"] : [fileSize / KiB, "KiB"];
  const string = toFixed(divided).padStart(4, " ");
  return `${string} ${unit}`;
}

const SECOND = 1000;

/**
 *
 * @param {number} durationMs
 * @returns {string}
 */
function printDurationMs(durationMs) {
  const divided = durationMs / SECOND;
  const [string, unit] =
    durationMs < SECOND
      ? [durationMs.toString(), "ms"]
      : [toFixed(divided), "s"];
  return `${string} ${unit}`.padStart(6, " ");
}

/**
 * @param {number} n
 * @returns {string}
 */
function toFixed(n) {
  const s1 = n.toFixed(2);
  if (s1.length <= 4) {
    return s1;
  }

  const s2 = n.toFixed(1);
  if (s2.length <= 4) {
    return s2;
  }

  return n.toFixed(0);
}

/**
 * @param {number} size
 * @param {number} baselineSize
 * @returns {string}
 */
function percentageChange(size, baselineSize) {
  return `${(-(1 - size / baselineSize) * 100).toFixed(0)} %`.padStart(5, " ");
}

/**
 * @param {number} value
 * @param {number} winningValue
 * @returns {string}
 */
function winner(value, winningValue) {
  return value === winningValue ? "🏆 " : "   ";
}

run().catch((error) => {
  console.error(error instanceof KnownError ? error.message : error);
  process.exitCode = 1;
});
