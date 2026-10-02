---
type: Fix
scope:
  - ckeditor5-dev-manual-server
---

Manual test pages with the `<ck-manual-header>` element now use the editor font family on `<body>` instead of the default browser font. The font is read from the `--ck-font-family` CSS custom property, and the legacy `--ck-font-face` property still takes precedence when it is overridden.
