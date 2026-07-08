---
type: Major breaking change
scope: ckeditor5-dev-tests
---

Removed the manual test server: the `ckeditor5-dev-tests-run-manual` binary and the entire webpack-based manual test compilation environment. Manual tests are now served by the Vite-based `@ckeditor/ckeditor5-dev-manual-server` package. The only remaining part of this package is the custom Vitest matchers (`toEqualMarkup()`).
