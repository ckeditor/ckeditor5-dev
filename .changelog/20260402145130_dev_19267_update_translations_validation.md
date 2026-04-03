---
type: Fix
scope:
  - ckeditor5-dev-translations
closes:
  - https://github.com/ckeditor/ckeditor5/issues/19267
---

Detect valid direct `Locale#t` calls such as `editor.locale.t()`, `editor.t()`, `locale.t()`, and `this.t()` during translation validation and synchronization.
