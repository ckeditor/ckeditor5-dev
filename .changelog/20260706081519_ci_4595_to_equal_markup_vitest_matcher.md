---
type: Major breaking change

scope:
  - ckeditor5-dev-tests

closes:
  - ckeditor/ckeditor5-internal#4595
---

Renamed the `equalMarkup` Chai assertion to the `toEqualMarkup()` Vitest matcher to match the Vitest naming style. Update the call sites (`expect( a ).to.equalMarkup( b )` → `expect( a ).toEqualMarkup( b )`) and register the matcher in a Vitest setup file via `expect.extend( { toEqualMarkup } )`, importing it from `@ckeditor/ckeditor5-dev-tests`.
