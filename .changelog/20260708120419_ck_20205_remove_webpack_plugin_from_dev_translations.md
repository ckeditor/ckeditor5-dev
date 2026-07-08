---
type: Other
scope:
  - ckeditor5-dev-translations
closes:
  - ckeditor/ckeditor5#20205
---

Removed the `CKEditorTranslationsPlugin` webpack plugin and the `MultipleLanguageTranslationService` class from the `@ckeditor/ckeditor5-dev-translations` package.

The plugin served only the legacy webpack-based installation methods, which were replaced by the new installation methods introduced in CKEditor 5 v42.0.0. No CKEditor 5 tooling uses it anymore, so it is removed as dead code. The `findMessages()`, `synchronizeTranslations()`, and `moveTranslations()` functions remain available.
