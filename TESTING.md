# NodeLab testing notes

## Results from the current build

- `node --check app.js` passes.
- HTML static checks: 45 IDs, no duplicate IDs, all 37 JavaScript ID lookups resolve, and the local `app.js` / `styles.css` assets exist.
- In-page regression suite: **29/29 assertions passed**.
- Node test harness: **148/148 cross-structure and edge-case check groups passed**.
- Randomized test sweep: **6,900 operation executions passed**. It runs 100 varied lists for each of the 3 structures and checks all 23 operations per list against expected results and outputs.
- Invalid-input handling: **30/30 cases returned validation errors safely**, including invalid insert/delete positions, invalid N-from-end values, and negative rotations.

## Re-run the tests

Run the repeatable engine tests from the project root with Node.js:

```bash
node --check app.js
node tests/engine.test.js
```

The page also exposes its 29-check regression suite. Open `index.html`, open the browser developer console, and run:

```js
NodeLabTest.runRegressionSuite()
```

## Scope and limits

The Node test harness evaluates the operation engine without launching the visual UI, so these results are not a browser-rendering or touch-interaction certification. Browser automation was blocked by the execution environment during this build's verification attempt, so desktop/mobile visual rendering remains unverified here. C snippets in the page are explanatory reference logic; they are not compiled or executed by NodeLab, and some snippets are intentionally abbreviated to focus on pointer changes.
