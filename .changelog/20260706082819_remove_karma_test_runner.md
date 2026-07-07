---
type: Major breaking change

scope:
  - ckeditor5-dev-tests
  - ckeditor5-dev-utils

see:
  - ckeditor/ckeditor5-internal#4595
---

Removed the automated test runner: the `ckeditor5-dev-tests-run-automated` binary and the entire Karma testing environment. Automated tests are now executed directly with Vitest, using the packages' own `test` scripts. The manual test server (`ckeditor5-dev-tests-run-manual`) is unaffected.

Along with the Karma environment, the following were removed:

* The `equalMarkup` Chai assertion. Use the `toEqualMarkup()` Vitest matcher exported by `@ckeditor/ckeditor5-dev-tests` instead.
* The IntelliJ Karma runner integration and desktop notifications support (`node-notifier`).
* The `loaders.getCoverageLoader()` function from `@ckeditor/ckeditor5-dev-utils`.
