# Elm Minification Benchmarks

A tool to help you evaluate what the best minifier for your Elm program is. The metrics are:

- How small is the code after minification?
- How small is the code after minification and brotli compression?
- How fast is the minifier?
- How much disk space does the minifier use, and how many dependencies does it have?
- Does the minifier break the program?

The output table is sorted by brotli size, but feel free to make your own trade-offs and conclusions.

Inspired by the excellent [JavaScript minification benchmarks](https://github.com/privatenumber/minification-benchmarks) repo.

## The winner?

If you use [SWC](https://swc.rs/) with the settings from the [Elm Guide](https://guide.elm-lang.org/optimization/asset_size), you seem to get about the smallest size in very little time. It’s not the fastest, but still not even close to a second even on a large Elm app (depending on the computer of course). It has just two dependencies (which are other `@swc/` packages). The executable size is roughly comparable to Elm’s executables.

```js
import * as swc from "@swc/core";

const pureFuncs = [ "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"]; // prettier-ignore

async function minify(code) {
  return (
    await swc.minify(code, {
      compress: {
        pure_funcs: pureFuncs,
        pure_getters: true,
        unsafe_comps: true,
        unsafe: true,
      },
      mangle: {
        reserved: pureFuncs,
      },
    })
  ).code;
}
```

## How to run

1. Clone this repo.
2. Install dependencies: `npm install`
3. Compile your Elm app: `elm make --optimize --output elm.js path/to/your/Main.elm`
4. Run this tool on the compiled JS: `node bench.js ../path/to/elm.js`

## How to add a new minifier

1. Install it: `npm install --save-exact my-minifier`
2. Copy `minifiers/(none).js` to `minifiers/my-minifier.js`.
3. Edit the `(code) => code` function to run your minifier. The function takes a string and returns a string or a promise of a string.
4. Try it with `node bench.js example-azimutt.js`.

## How to add a new configuration for a minifier

1. Copy `minifiers/my-minifier.js` to `minifiers/my-minifier_variation.js`.
2. Edit it as you like.
3. Try it with `node bench.js example-azimutt.js`.

## Example

The winner in each column is marked with `❱`.

```
❯ node bench.js example-azimutt.js
┌─────────┬───────────────────────┬───────────┬────────────┬───────┬──────────────┬─────────┬──────────────┬─────────┬───────────────────────────────────────────────────────┐
│ (index) │ name                  │ version   │ time       │ x     │ size         │ %       │ brotli ↓     │ %       │ installation size and dependencies                    │
├─────────┼───────────────────────┼───────────┼────────────┼───────┼──────────────┼─────────┼──────────────┼─────────┼───────────────────────────────────────────────────────┤
│ 0       │ '(none)'              │ ''        │ ''         │ ''    │ '  1.35 MiB' │ ''      │ '   167 KiB' │ ''      │ ''                                                    │
│ 1       │ '@swc/core_elm-guide' │ '1.13.2'  │ '  108 ms' │ 'x3'  │ '   411 KiB' │ '-70 %' │ '❱  101 KiB' │ '-40 %' │ 'https://packagephobia.com/result?p=@swc/core'        │
│ 2       │ 'uglify-js_elm-guide' │ '3.19.3'  │ '  2.22 s' │ 'x72' │ '❱  402 KiB' │ '-71 %' │ '   102 KiB' │ '-39 %' │ 'https://packagephobia.com/result?p=uglify-js'        │
│ 3       │ '@swc/core'           │ '1.13.2'  │ '  104 ms' │ 'x3'  │ '   410 KiB' │ '-70 %' │ '   102 KiB' │ '-39 %' │ 'https://packagephobia.com/result?p=@swc/core'        │
│ 4       │ 'terser_elm-guide'    │ '5.43.1'  │ '  1.57 s' │ 'x51' │ '   412 KiB' │ '-70 %' │ '   102 KiB' │ '-39 %' │ 'https://packagephobia.com/result?p=terser'           │
│ 5       │ 'uglify-js'           │ '3.19.3'  │ '  2.06 s' │ 'x66' │ '   405 KiB' │ '-71 %' │ '   103 KiB' │ '-38 %' │ 'https://packagephobia.com/result?p=uglify-js'        │
│ 6       │ 'uglify-js+esbuild'   │ ''        │ '  1.64 s' │ 'x53' │ '   403 KiB' │ '-71 %' │ '   104 KiB' │ '-38 %' │ ''                                                    │
│ 7       │ 'terser'              │ '5.43.1'  │ '  1.26 s' │ 'x41' │ '   415 KiB' │ '-70 %' │ '   104 KiB' │ '-38 %' │ 'https://packagephobia.com/result?p=terser'           │
│ 8       │ 'oxc-minify'          │ '0.78.0'  │ '   38 ms' │ 'x1'  │ '   423 KiB' │ '-69 %' │ '   105 KiB' │ '-37 %' │ 'https://packagephobia.com/result?p=oxc-minify'       │
│ 9       │ 'esbuild_tweaked'     │ '0.25.8'  │ '   57 ms' │ 'x2'  │ '   423 KiB' │ '-69 %' │ '   107 KiB' │ '-36 %' │ 'https://packagephobia.com/result?p=esbuild'          │
│ 10      │ 'esbuild'             │ '0.25.8'  │ '   54 ms' │ 'x2'  │ '   430 KiB' │ '-69 %' │ '   110 KiB' │ '-34 %' │ 'https://packagephobia.com/result?p=esbuild'          │
│ 11      │ 'bun'                 │ '1.2.19'  │ '❱  31 ms' │ 'x1'  │ '   432 KiB' │ '-69 %' │ '   110 KiB' │ '-34 %' │ 'https://packagephobia.com/result?p=bun'              │
│ 12      │ '@tdewolff/minify'    │ '2.23.10' │ '   47 ms' │ 'x2'  │ '   434 KiB' │ '-69 %' │ '   114 KiB' │ '-32 %' │ 'https://packagephobia.com/result?p=@tdewolff/minify' │
└─────────┴───────────────────────┴───────────┴────────────┴───────┴──────────────┴─────────┴──────────────┴─────────┴───────────────────────────────────────────────────────┘
```
