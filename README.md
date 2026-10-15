# NodeLab — Linked Lists, Visualized

A responsive, offline-friendly interactive lab for learning **singly linked lists, circular singly linked lists, and doubly linked lists** in C.

## Features

- Three linked-list structures with structure-aware link diagrams.
- 23 operations: insert at front/end/position/before/after; delete front/end/position/by value/all matches; search; update; count; display; find middle; Nth from end; reverse; sort; rotate left/right; remove duplicates; palindrome check; clear.
- Step-by-step conceptual pointer traces, pointer inspector, operation output, previous/next and play controls.
- C reference snippets for core pointer operations, adapted to each list type.
- Load a custom list, undo, reset, dark mode, keyboard `/` shortcut for operation search.
- Built with plain HTML, CSS, and JavaScript. No build step, framework, external API, or runtime dependency.
- Built-in regression test helper for core operation and edge-case checks (29 assertions).

## Run locally

1. Download or clone this folder.
2. Open `index.html` in a modern browser.
3. Pick a structure and operation in the interactive lab.

The site uses system font stacks and local assets, so it runs offline without third-party requests.

## GitHub Pages

1. Create a new GitHub repository, for example `linked-list-lab`.
2. Upload the project files (`index.html`, `styles.css`, `app.js`, `README.md`, `TESTING.md`, `LICENSE`, and `.gitignore`) to the repository root.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
5. After GitHub Pages publishes the site, use the URL shown in the Pages settings.

## Notes about the visualizer

NodeLab simulates pointer changes in a browser model so you can inspect each conceptual step. It does **not** compile or execute the C snippets. C reference examples are intended to show the relevant pointer logic; review edge cases and complete the surrounding function before using them in a lab submission.

The list uses 1-based positions. “Delete by value” removes the first match; “Delete all matches” removes every occurrence. “Nth from end” uses `1` for the tail. For even-length lists, “Find middle” returns the second middle node.

## Run the regression tests

The in-page suite can be run from the browser developer console:

```js
NodeLabTest.runRegressionSuite()
```

For the larger Node-only test suite, install Node.js and run from the project folder:

```bash
node tests/engine.test.js
```

It exercises all 23 operations across singly, circular, and doubly linked lists, uses randomized input lists, and checks invalid positions and edge cases. It does not test browser layout or compile the C reference snippets.

## Validation notes

The current build passes JavaScript syntax checks, has no duplicate HTML IDs or missing IDs referenced by the JavaScript, and passes the built-in regression suite (29/29). The repeatable Node test script runs 6,900 randomized operation checks over all three structure types, plus 148 boundary and cross-structure check groups and 30 invalid-input cases.

The operation engine is tested independently from the page layout. Full visual rendering and touch interactions have **not** been verified in an actual browser in this environment, and the displayed C snippets are reference examples, not compiled programs.

See [TESTING.md](TESTING.md) for details and how to rerun the checks.

## License

MIT. See `LICENSE`.
