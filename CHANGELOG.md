Changelog
=========

## [54.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v53.4.0...v54.0.0) (November 13, 2025)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Removed unused scripts. Closes [ckeditor/ckeditor5#19266](https://github.com/ckeditor/ckeditor5/issues/19266).

  The change affects the following scripts:

  * `ckeditor5-dev-ci-notify-travis-status`,
  * `ckeditor5-dev-ci-allocate-swap-memory`,
  * `ckeditor5-dev-ci-install-latest-chrome`.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools), [bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year), [changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog), [ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci), [dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker), [docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs), [release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools), [stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot), [tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests), [translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations), [utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils), [web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler), [typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Upgrade to and require at least Node v24.11.

### Features

* **[license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker)**: Added new package: `@ckeditor/ckeditor5-dev-license-checker`.

  The new package exports the `validateLicenseFiles()` function that allows for validation and fixing of license files, based on dependencies of the given package.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.0.0): v53.4.0 => v54.0.0

Minor releases (contain minor breaking changes):

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.0.0): v53.4.0 => v54.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.0.0): v53.4.0 => v54.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.0.0): v53.4.0 => v54.0.0
</details>


## [53.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v53.3.2...v53.4.0) (October 23, 2025)

### Features

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Updated CI utility scripts to support and prefer passing arguments via CLI instead of environment variables. Closes [ckeditor/ckeditor5#19245](https://github.com/ckeditor/ckeditor5/issues/19245).

  The change affects the following scripts:

  * `ckeditor5-dev-ci-circle-disable-auto-cancel-builds`
  * `ckeditor5-dev-ci-circle-enable-auto-cancel-builds`
  * `ckeditor5-dev-ci-circle-workflow-notifier`
  * `ckeditor5-dev-ci-is-job-triggered-by-member`
  * `ckeditor5-dev-ci-is-workflow-restarted`
  * `ckeditor5-dev-ci-notify-circle-status`
  * `ckeditor5-dev-ci-trigger-circle-build`

  For detailed usage instructions, see the [README](https://github.com/ckeditor/ckeditor5-dev/tree/master/packages/ckeditor5-dev-ci).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/53.4.0): v53.3.2 => v53.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/53.4.0): v53.3.2 => v53.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/53.4.0): v53.3.2 => v53.4.0
</details>


## [53.3.2](https://github.com/ckeditor/ckeditor5-dev/compare/v53.3.1...v53.3.2) (October 14, 2025)

### Bug fixes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Fix `Can't resolve '*-loader'` webpack errors when linking the package to other projects. Closes [ckeditor/ckeditor5-commercial#8655](https://github.com/ckeditor/ckeditor5-commercial/issues/8655).
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Add missing `babel-loader` to dependencies.

### Other changes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Ensure single-file output by enabling `inlineDynamicImports=true` in Rollup ESM and UMD builds. Closes [ckeditor/ckeditor5#19226](https://github.com/ckeditor/ckeditor5/issues/19226).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/53.3.2): v53.3.1 => v53.3.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/53.3.2): v53.3.1 => v53.3.2
</details>


## [53.3.1](https://github.com/ckeditor/ckeditor5-dev/compare/v53.3.0...v53.3.1) (October 9, 2025)

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Add support for specifying a custom npm [dist-tag](https://docs.npmjs.com/cli/v8/commands/npm-dist-tag) via the new `npmTag` option (defaults to `'latest'`).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/53.3.1): v53.3.0 => v53.3.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/53.3.1): v53.3.0 => v53.3.1
</details>


## [53.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v53.2.0...v53.3.0) (October 8, 2025)

### Features

* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Updated the `checkVersionMatch()` function to support the [`workspace:*`](https://pnpm.io/workspaces) protocol for dependencies.

  Added a `workspacePackages` option that specify the list of packages that should use `workspace:*` instead of specific version numbers. Both `dependencies` and `devDependencies` are validated to ensure consistent workspace versioning with pnpm.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/53.3.0): v53.2.0 => v53.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/53.3.0): v53.2.0 => v53.3.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/53.3.0): v53.2.0 => v53.3.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
