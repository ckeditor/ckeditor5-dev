Changelog
=========

## [61.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v61.3.0...v61.4.0) (October 28, 2026)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: `publishPackages()` accepts the `staging-v{version}` npm tag for a stable release when `{version}` is the exact package version, for example `staging-v1.2.3` for v1.2.3. It lets several release lines stage their packages at the same time without moving one shared `staging` tag.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Added the `removeNpmTags()` function. It removes an npm dist-tag from all given packages, for example, a temporary tag used to stage a release. It works like `reassignNpmTags()`: it supports npm Trusted Publishing (OIDC), retries failed packages, and rejects after all packages have been processed when any of them failed. Packages that do not have the tag are reported as skipped, so it can be run again after a partial failure.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `reassignNpmTags()` task now rejects when the npm dist-tag could not be changed for at least one package. Before, the task only listed the errors in the output and resolved successfully, so release automation reported a success even though the tag was not moved.

  The task still processes all packages, retries each failed call, and prints the list of errors. Packages whose tag already points to the requested version are still reported as skipped and do not cause a rejection. The error message lists the packages that failed.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: `getVersionForTag()` no longer returns `null` when the npm registry cannot answer, for example, when it cannot be reached. It returns `null` only when the registry says that the tag or the package does not exist, and it rethrows any other error. Before, a network error looked like a missing tag. Then `isLatestOrNextStableVersion()` treated any version as the newest one, so a script could move the `latest` tag to an older release line.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: `npm.checkVersionAvailability()` no longer reports a version as available when the npm registry cannot answer, for example, when it cannot be reached. It resolves to `true` only when the registry says that the version or the package does not exist, and it rethrows any other error. Before, a network error made an already published version look available. `publishPackages()` and the changelog version prompt use this check, so they now fail with the network error instead of continuing.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/61.4.0): v61.3.0 => v61.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/61.4.0): v61.3.0 => v61.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/61.4.0): v61.3.0 => v61.4.0
</details>


## [61.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v61.2.0...v61.3.0) (October 1, 2026)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Introduced the `useOidc` option in the `reassignNpmTags()` task to support npm Trusted Publishing. When enabled, the task no longer verifies the npm account with `npm whoami` and the `npmOwner` option is not required. Instead, the task verifies that the `NPM_ID_TOKEN` environment variable is set. Changing dist-tags with OIDC requires npm 11.21.0 or newer and a trusted publisher that allows the `npm dist-tag` command.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `publishPackages()` and `reassignNpmTags()` tasks no longer fail on CircleCI when a release with npm Trusted Publishing (`useOidc`) takes longer than 5 minutes. See [ckeditor/ckeditor5-internal#4658](https://github.com/ckeditor/ckeditor5-internal/issues/4658).

  * npm accepts a CircleCI OIDC token only for 5 minutes after it was issued. Before, the remaining packages failed with `401 unauthorized`.
  * On CircleCI, the tasks now request a fresh token with the CircleCI CLI (`circleci`) right before each `npm publish` and `npm dist-tag add` call.
  * Without the CircleCI CLI, or outside CircleCI, the tasks use the `NPM_ID_TOKEN` environment variable, as before.
  * When no token can be obtained, the tasks stop before processing any package.
  * The new `getNpmIdToken()` function returns the token that the tasks use. It is exported from the package.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/61.3.0): v61.2.0 => v61.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/61.3.0): v61.2.0 => v61.3.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/61.3.0): v61.2.0 => v61.3.0
</details>


## [61.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v61.1.0...v61.2.0) (September 4, 2026)

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server now reloads complete HTML documents after edits, including changes made inside `<head>`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/61.2.0): v61.1.0 => v61.2.0
</details>


## [61.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v61.0.0...v61.1.0) (August 21, 2026)

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added a Vite plugin that preserves CSS import order in production builds.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The GitHub token used by the release workflow is now verified against the target repository instead of being required to contain 40 characters.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `updateDependencies()` release helper now allows excluding the package in the working directory.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/61.1.0): v61.0.0 => v61.1.0
</details>


## [61.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v60.0.0...v61.0.0) (August 19, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The deprecated `findPathsToPackages()` and `checkVersionAvailability()` functions are no longer exported. Use the `workspaces` and `npm` namespaces from `@ckeditor/ckeditor5-dev-utils` instead.
* Removed the `@ckeditor/ckeditor5-dev-dependency-checker` package. It was built on top of the deprecated `depcheck` library. Use [`knip`](https://knip.dev/) to validate dependencies instead.

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server now preserves CSS import order when bundled dev splits styles across chunks.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/61.0.0): v60.0.0 => v61.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/61.0.0): v60.0.0 => v61.0.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
