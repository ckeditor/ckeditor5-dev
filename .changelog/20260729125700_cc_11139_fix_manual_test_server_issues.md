---
type: Fix
scope:
  - ckeditor5-dev-manual-server
---

Manual tests now load the package theme stylesheets from `theme/index-editor.css` and `theme/index-content.css` instead of the removed `theme/index.css`, restoring package styles on manual test pages.

The manual test header no longer covers sticky toolbars, menu bars, and balloons when the page is scrolled. The header bar now stays in the normal document flow instead of being fixed to the viewport.
