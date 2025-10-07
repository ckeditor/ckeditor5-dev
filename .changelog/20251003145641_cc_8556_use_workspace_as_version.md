---
type: Feature
scope:
  - ckeditor5-dev-dependency-checker
see:
  - ckeditor/ckeditor5-commercial#8556
---

Updated the `checkVersionMatch()` function to support the [`workspace:*`](https://pnpm.io/workspaces) protocol for dependencies.

Added a `useWorkspace` option that enforces using `workspace:*` instead of specific version numbers. Both `dependencies` and `devDependencies` (for packages matching `devDependenciesFilter`) are now validated to ensure consistent workspace versioning with pnpm.
