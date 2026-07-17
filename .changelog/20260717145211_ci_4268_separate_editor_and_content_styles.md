---
type: Major breaking change

scope:
  - ckeditor5-dev-build-tools
---

Replaced the `splitCss` plugin with the reworked `bundleCss` plugin. CSS must now be imported through explicit `theme/index-editor.css` and `theme/index-content.css` entry points, and builds emit separate editor and content stylesheets next to the combined CSS bundle. The combined bundle preserves the JavaScript import order, keeping the editor and content styles of each feature next to each other.
