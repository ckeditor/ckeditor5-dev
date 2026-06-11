---
type: Fix
scope:
  - ckeditor5-dev-manual-server
---

The manual test server no longer removes external scripts whose file names match a manual test entry script.

This preserves CDN scripts when wrapping and serving manual tests.
