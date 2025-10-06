---
type: Feature
scope:
  - ckeditor5-dev-dependency-checker
see:
  - ckeditor/ckeditor5-commercial#8556
---

Using `workspace:*` for dependencies in `checkVersionMatch` function.
Added `useWorkspace` property to verify if packages should use `workspace:*` as version.
Dependencies that pass the `devDependenciesFilter` are now expected to use `workspace:*` instead of specific version numbers.
This change supports pnpm workspace dependencies and ensures consistent versioning across workspace packages.
