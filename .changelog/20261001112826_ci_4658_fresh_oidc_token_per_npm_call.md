---
type: Fix
scope:
  - ckeditor5-dev-release-tools
see:
  - ckeditor/ckeditor5-internal#4658
---

The `publishPackages()` and `reassignNpmTags()` tasks no longer fail on CircleCI when a release with npm Trusted Publishing (`useOidc`) takes longer than 5 minutes.

* npm accepts a CircleCI OIDC token only for 5 minutes after it was issued. Before, the remaining packages failed with `401 unauthorized`.
* On CircleCI, the tasks now request a fresh token with the CircleCI CLI (`circleci`) right before each `npm publish` and `npm dist-tag add` call.
* Without the CircleCI CLI, or outside CircleCI, the tasks use the `NPM_ID_TOKEN` environment variable, as before.
* When no token can be obtained, the tasks stop before processing any package.
* The new `getNpmIdToken()` function returns the token that the tasks use. It is exported from the package.
