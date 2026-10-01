---
type: Feature
scope:
  - ckeditor5-dev-manual-server
---

Manual test pages with the `<ck-manual-header>` element now add default horizontal padding around the test content, so the editor no longer touches the edges of the browser window. The header bar still spans the full window width, and the space below it matches the side padding.

The padding is controlled by the `--ck-page-padding` CSS custom property on `<body>`. Tests that need a full-width layout can opt out with `body { --ck-page-padding: 0; }`.
