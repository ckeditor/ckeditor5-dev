---
type: Major breaking change
---

Removed the `@ckeditor/ckeditor5-dev-tests` package. The only remaining part of the package, the custom `toEqualMarkup()` Vitest matcher, now lives directly in the `ckeditor/ckeditor5` repository. If you registered the matcher in your own Vitest setup file, copy its implementation from the `scripts/vitest/matchers.mjs` file in that repository instead.
