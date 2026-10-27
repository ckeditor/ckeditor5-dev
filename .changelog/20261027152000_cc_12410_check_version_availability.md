---
type: Fix
scope:
  - ckeditor5-dev-utils
see:
  - https://github.com/ckeditor/ckeditor5-commercial/issues/12410
---

`npm.checkVersionAvailability()` no longer reports a version as available when the npm registry cannot answer, for example, when it cannot be reached. It resolves to `true` only when the registry says that the version or the package does not exist, and it rethrows any other error. Before, a network error made an already published version look available. `publishPackages()` and the changelog version prompt use this check, so they now fail with the network error instead of continuing.
