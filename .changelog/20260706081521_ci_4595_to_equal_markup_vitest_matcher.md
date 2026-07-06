---
type: Major breaking change

scope:
  - ckeditor5-dev-tests

see:
  - ckeditor/ckeditor5-internal#4595
---

Removed the `attribute` Chai assertion (`lib/utils/automated-tests/assertions/attribute.js`). It is no longer used by any CKEditor 5 tests.

Additionally, the main entry point of the package no longer exports the `runAutomatedTests()`, `runManualTests()`, and `parseArguments()` functions, as their Node.js-only dependencies would prevent importing the module in a browser context (a Vitest setup file). They are used internally by the `ckeditor5-dev-tests-run-automated` and `ckeditor5-dev-tests-run-manual` binary scripts, which remain the public interface of the test runners. The main entry point now exposes only the custom Vitest matchers.
