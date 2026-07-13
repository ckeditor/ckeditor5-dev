---
type: Feature
scope:
  - ckeditor5-dev-release-tools
---

Introduced the `useOidc` option in the `publishPackages()` task to support npm Trusted Publishing. When enabled, the task no longer verifies the npm account with `npm whoami` and the `npmOwner` option is not required. Instead, the task verifies that the `NPM_ID_TOKEN` environment variable is set, as npm exchanges the OIDC token only during supported operations, such as `npm publish`.
