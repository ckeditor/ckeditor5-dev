---
type: Major breaking change
scope:
  - ckeditor5-dev-translations
---

Replaced PO translation file support with generated TypeScript translation modules. The translation management utilities now read, create, synchronize, and move TypeScript translation sources.

The `synchronizeTranslations()` and `moveTranslations()` functions are now asynchronous and must be awaited. The new `readTranslationFile()` function is asynchronous and must be awaited, while `serializeTranslationFile()` serializes a translation dictionary synchronously.

The `synchronizeTranslations()` function now accepts `translationsTypeImportSource` to select the package from which generated files import the `Translations` type. It defaults to `@ckeditor/ckeditor5-utils`.
