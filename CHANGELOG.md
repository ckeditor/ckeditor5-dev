Changelog
=========

## [52.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v51.1.0...v52.0.0) (September 8, 2025)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Removed git-based changelog utils after switching to a Markdown-based solution. Closes [ckeditor/ckeditor5#18907](https://github.com/ckeditor/ckeditor5/issues/18907).

  The following utils have been removed:

  * `generateChangelogForSinglePackage()`,
  * `generateChangelogForMonoRepository()`,
  * `saveChangelog()`.

  Markdown-based changelog utils are available in the `@ckeditor/ckeditor5-dev-changelog` package.

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Added an optional `cwd` option for `validateRepositoryToRelease()`. Closes [ckeditor/ckeditor5#19059](https://github.com/ckeditor/ckeditor5/issues/19059).
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Add `kapa.ai` to the list of ignored hosts. Closes [ckeditor/ckeditor5#19064](https://github.com/ckeditor/ckeditor5/issues/19064).

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Fixed `validateRepositoryToRelease()` not throwing error when the current branch only partially matches the defined required branch. Closes [ckeditor/ckeditor5#19059](https://github.com/ckeditor/ckeditor5/issues/19059).

  Before the fix, branches with a suffix, eg. `master_foo` would not throw when defined required branch was `master`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/52.0.0): v51.1.0 => v52.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/52.0.0): v51.1.0 => v52.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/52.0.0): v51.1.0 => v52.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/52.0.0): v51.1.0 => v52.0.0
</details>


## [51.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v51.0.0...v51.1.0) (August 21, 2025)

### Features

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Added a top-level `linkFilter()` callback option for changelog generators that determines which issue links should be preserved in the generated changelog and which should be removed. If the `shouldSkipLinks` flag is also provided, the `shouldSkipLinks` flag takes precedence over the `linkFilter()` callback to maintain backward compatibility. Closes [ckeditor/ckeditor5#18936](https://github.com/ckeditor/ckeditor5/issues/18936).

### Bug fixes

* Don't hardcode the path to the `@ckeditor/ckeditor5-theme-lark` package.

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs), [typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Bumped TypeDoc to the latest version: v0.28.9. Closes [ckeditor/ckeditor5#18905](https://github.com/ckeditor/ckeditor5/issues/18905).
* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Normalized Markdown lists in the generated changelog and from now on lists are always defined by the `*` character. Closes [ckeditor/ckeditor5#18908](https://github.com/ckeditor/ckeditor5/issues/18908).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/51.1.0): v51.0.0 => v51.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/51.1.0): v51.0.0 => v51.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/51.1.0): v51.0.0 => v51.1.0
</details>


## [51.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v50.3.1...v51.0.0) (August 12, 2025)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: The `ckeditor5-dev-dependency-checker` now adds `ckeditor5-root` by default to list of ignored dependencies.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Build of the `ckeditor5` package should be located in root of `ckeditor5` package. Previously, it was expected in the current working directory.

### Features

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Introduce support for non-stable releases in the changelog generating tool. Closes [ckeditor/ckeditor5#18842](https://github.com/ckeditor/ckeditor5/issues/18842).

  The following flow has been implemented to ensure clarity during the preparation process:

  - A new interactive prompt now asks users to specify whether the release is a _pre-release_ (e.g., `alpha`, `beta`, `rc`), _pre-release_ promotion or a _stable_ release.
  - Changelog entries are **no longer deleted** during non-stable releases. Instead, they are **moved to a pre-release subdirectory** inside `.changelog/`.
  - When continuing within the same channel (e.g., multiple alphas), only top-level `.md` files are included.
  - When transitioning to a **new channel**, tool collects entries from **pre-release directory**, ensuring no loss entries.
  - Stable (latest) releases now aggregate all prior changelog entries across cycles, and remove all of them after generating the changelog to start fresh.

  Thanks to that, the generated changelog provides **clear traceability** of what was shipped during each phase, and reduces the chance of human error through improved automation and prompts.

### Bug fixes

* References pointing to an issue from the current repository that use full URL format will now be properly shortened. Closes [ckeditor/ckeditor5#18821](https://github.com/ckeditor/ckeditor5/issues/18821).
* Don't hardcode the path to the `@ckeditor/ckeditor5-utils` package.

### Other changes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Apply minor improvements to changelog template.
* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Disallowed "internal" as a valid release type. Closes [ckeditor/ckeditor5#18894](https://github.com/ckeditor/ckeditor5/issues/18894).

  The "internal" version identifier is no longer accepted to enforce consistent and meaningful versioning.
  Developers must now provide a clear reason for publishing a release. Attempts to use "internal" will result in a validation error.
* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Added validation to the version provided in the `nextVersion` property. It must be a valid version in terms of the semantic versioning specification. The nightly version prefix `0.0.0-` is accepted without validation. Closes [ckeditor/ckeditor5#18901](https://github.com/ckeditor/ckeditor5/issues/18901).
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added support for running tests for packages by specifying a full directory name. Closes [ckeditor/ckeditor5#18891](https://github.com/ckeditor/ckeditor5/issues/18891).

  Removed support for running tests for root directory tests. e.g. Running `yarn test -f ckeditor5` will now target a directory `packages/ckeditor5` instead of the root of the monorepo.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Improved file path handling and cross-platform support in the `tools.commit()` function. Now correctly includes valid files in commits, skips missing ones, and avoids creating empty commits. Closes [ckeditor/ckeditor5#18878](https://github.com/ckeditor/ckeditor5/issues/18878).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/51.0.0): v50.3.1 => v51.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/51.0.0): v50.3.1 => v51.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/51.0.0): v50.3.1 => v51.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/51.0.0): v50.3.1 => v51.0.0
</details>


## [50.3.1](https://github.com/ckeditor/ckeditor5-dev/compare/v50.3.0...v50.3.1) (July 9, 2025)

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Upgraded the `@ckeditor/ckeditor5-inspector` package to its latest version. See [ckeditor/ckeditor5#18583](https://github.com/ckeditor/ckeditor5/issues/18583).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/50.3.1): v50.3.0 => v50.3.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/50.3.1): v50.3.0 => v50.3.1
</details>


## [50.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v50.2.0...v50.3.0) (July 3, 2025)

### Features

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Display a warning when generating a changelog entry from a protected branch. Closes [ckeditor/ckeditor5#18733](https://github.com/ckeditor/ckeditor5/issues/18733).
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Added the `timeout` configuration option to the `runCrawler()` function and export the `DEFAULT_TIMEOUT` variable.

### Bug fixes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: The `generateChangelogForSingleRepository()` task suggests bumping the major version when detecting a "BREAKING CHANGE" entry. Closes [ckeditor/ckeditor5#18772](https://github.com/ckeditor/ckeditor5/issues/18772).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/50.3.0): v50.2.0 => v50.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/50.3.0): v50.2.0 => v50.3.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/50.3.0): v50.2.0 => v50.3.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
