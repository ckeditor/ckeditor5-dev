---
type: Major breaking change
scope: ckeditor5-dev-utils
---

Removed the `loaders` namespace (`getTypeScriptLoader()`, `getJavaScriptLoader()`, `getDebugLoader()`, `getIconsLoader()`, `getFormattedTextLoader()`, `getStylesLoader()`) together with the `ck-debug-loader` and `ck-lightningcss-loader` webpack loaders. They were only used by the removed webpack-based test environment.
