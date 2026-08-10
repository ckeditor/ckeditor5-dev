---
type: Major breaking change
scope:
  - ckeditor5-dev-build-tools
  - ckeditor5-dev-translations
---

Replaced PO translation file support with generated TypeScript translation modules. The build tools now collect TypeScript translation sources, while the translation management utilities read, create, synchronize, and move them.

The `synchronizeTranslations()`, `moveTranslations()`, and `readTranslationFile()` functions are now asynchronous and must be awaited.
