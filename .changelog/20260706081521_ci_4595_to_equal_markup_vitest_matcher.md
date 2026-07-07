---
type: Major breaking change

scope:
  - ckeditor5-dev-tests

see:
  - ckeditor/ckeditor5-internal#4595
---

Introduced the `toEqualMarkup()` Vitest matcher. It replaces the `equalMarkup` Chai assertion and is exported from the main entry point of the package.

The main entry point now exposes only the custom Vitest matchers, so it can be imported in a browser context (for example, in a Vitest setup file). It no longer exports the `runAutomatedTests()`, `runManualTests()`, and `parseArguments()` functions, which were only used internally by the test runner binaries. Additionally, the unused `attribute` Chai assertion was removed.
