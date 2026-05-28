---
type: Major breaking change
scope:
  - ckeditor5-dev-build-tools
---

Changed `ckeditor5-dev-build-tools` to assume that package sources use TypeScript isolated declarations.

Declaration files are now generated without invoking TypeScript, so builds no longer perform type checking.
