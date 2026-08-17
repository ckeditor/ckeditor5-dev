---
type: Major breaking change
scope:
  - ckeditor5-dev-build-tools
---

Replaced PO translation file support with generated TypeScript translation modules. The build tools now collect TypeScript translation sources from `**/lang/translations/*.ts` by default and load them through native `import()`. Each module must default-export translations keyed by the language code matching its filename, for example `en.ts` must export an `en` key.

Dictionary-only sources no longer emit a `getPluralForm` property (or `"getPluralForm": null`) in ESM output, and a dictionary-only UMD source does not overwrite an already registered plural function.
