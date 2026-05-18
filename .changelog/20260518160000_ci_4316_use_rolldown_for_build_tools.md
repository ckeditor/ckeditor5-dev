---
type: Major breaking change
scope:
  - ckeditor5-dev-build-tools
---

Removed the `loadTypeScriptSources`, `replaceImports`, and `emitCss` exports from `ckeditor5-dev-build-tools`.

The `loadTypeScriptSources` and `replaceImports` behavior is now handled by Rolldown. The `bundleCss` plugin now ensures that a CSS file is always emitted, including when the generated file is empty.
