---
type: Fix
scope:
  - ckeditor5-dev-docs
---

Resolve the `typedoc-plugin-rename-defaults` plugin to an absolute path before passing it to TypeDoc. TypeDoc resolves a bare plugin name relative to its own install location, which fails when TypeDoc is linked from outside the project tree - for example when a consumer enables pnpm's `enableGlobalVirtualStore` and TypeDoc is served from the global store.
