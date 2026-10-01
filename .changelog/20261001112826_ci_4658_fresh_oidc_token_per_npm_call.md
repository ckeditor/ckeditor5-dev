---
type: Fix
scope:
  - ckeditor5-dev-release-tools
---

The `publishPackages()` and `reassignNpmTags()` tasks now request a fresh OIDC token on CircleCI right before each `npm publish` and `npm dist-tag add` call when `useOidc` is enabled. npm accepts a CircleCI OIDC token in the npm Trusted Publishing token exchange only for 5 minutes after it was issued, so a release that took longer failed with `401 unauthorized` for the remaining packages. Outside CircleCI, the `NPM_ID_TOKEN` environment variable is still used.
