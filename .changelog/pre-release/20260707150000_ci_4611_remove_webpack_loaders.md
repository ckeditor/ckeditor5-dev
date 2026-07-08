---
type: Major breaking change

scope:
  - ckeditor5-dev-utils

see:
  - ckeditor/ckeditor5-internal#4595
---

Removed the `loaders` namespace (`getCoverageLoader()`, `getTypeScriptLoader()`, `getJavaScriptLoader()`, `getDebugLoader()`, `getIconsLoader()`, `getFormattedTextLoader()`, `getStylesLoader()`) together with the `ck-debug-loader` and `ck-lightningcss-loader` webpack loaders. They were only used by the removed Karma and webpack-based manual test environments.
