---
type: Major breaking change

scope:
  - ckeditor5-dev-tests

closes:
  - ckeditor/ckeditor5-internal#4595
---

Replaced the `equalMarkup` Chai assertion with the `toEqualMarkup()` Vitest matcher to match the Vitest naming style. Update the call sites (`expect( a ).to.equalMarkup( b )` → `expect( a ).toEqualMarkup( b )`) and register the matcher in a Vitest setup file via `expect.extend( { toEqualMarkup } )`, importing it from `@ckeditor/ckeditor5-dev-tests`.

The main entry point of the package now exposes only the custom Vitest matchers, so it can be imported in a browser context (for example, in a Vitest setup file). It no longer exports the `runAutomatedTests()`, `runManualTests()`, and `parseArguments()` functions, which were only used internally by the test runner binaries. Additionally, the unused `attribute` Chai assertion was removed.
