---
type: Feature

scope:
  - ckeditor5-dev-tests

closes:
  - ckeditor/ckeditor5-internal#4595
---

Introduced the `toEqualMarkup()` Vitest matcher as a replacement for the `equalMarkup` Chai assertion. Register it in a Vitest setup file via `expect.extend( markupMatchers )` imported from `@ckeditor/ckeditor5-dev-tests`.
