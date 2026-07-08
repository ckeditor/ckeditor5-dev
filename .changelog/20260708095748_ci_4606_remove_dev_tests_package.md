---
type: Major breaking change
---

Removed the `@ckeditor/ckeditor5-dev-tests` package, including the `ckeditor5-dev-tests-run-manual` binary and the entire webpack-based manual test environment. Manual tests are now served by the Vite-based `@ckeditor/ckeditor5-dev-manual-server` package. The custom `toEqualMarkup()` Vitest matcher now lives directly in the `ckeditor/ckeditor5` repository. If you registered the matcher in your own Vitest setup file, copy its implementation from the `scripts/vitest/matchers.mjs` file in that repository instead.
