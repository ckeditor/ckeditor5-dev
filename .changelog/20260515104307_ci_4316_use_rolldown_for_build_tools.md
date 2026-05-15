---
type: Major breaking change
scope:
  - ckeditor5-dev-build-tools
---

Removed output path rewriting from `ckeditor5-dev-build-tools` except for package imports rewritten to `ckeditor5` and `ckeditor5-premium-features` in browser builds.

The `rewrite` JavaScript API option was removed. Imports using `ckeditor5/src/*` and `ckeditor5-collaboration/src/*` are no longer rewritten automatically.
