---
type: Feature
scope:
  - ckeditor5-dev-dependency-checker
---

Updated the `checkVersionMatch()` function to support the [`workspace:*`](https://pnpm.io/workspaces) protocol for dependencies.

Added a `workspacePackages` option that specify the list of packages that should use `workspace:*` instead of specific version numbers. Both `dependencies` and `devDependencies` are validated to ensure consistent workspace versioning with pnpm.
