---
type: Major breaking change

scope:
  - ckeditor5-dev-tests

see:
  - ckeditor/ckeditor5-internal#4595
---

Removed the `attribute` Chai assertion (`lib/utils/automated-tests/assertions/attribute.js`). It is no longer used by any CKEditor 5 tests.

Additionally, the `parseArguments()` function is no longer exported from the package's main entry point, as it would prevent importing the module in a browser context. It is used internally by the `ckeditor5-dev-tests-run-automated` and `ckeditor5-dev-tests-run-manual` binary scripts.
