---
type: Minor breaking change
scope:
  - ckeditor5-dev-translations
---

The validation mode of `synchronizeTranslations()` (the `validateOnly` option) now also examines the translation files. It reports the files that are missing or not synchronized with the contexts and the source messages. Before, the validation passed even when the synchronization would still change files. If the validation reports a file, run the synchronization and commit the changes.
