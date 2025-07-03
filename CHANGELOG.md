Changelog
=========

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


## [50.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v50.1.2...v50.2.0) (June 26, 2025)

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Add support for importing raw file content by appending `?raw` query parameter to import path. See [ckeditor/ckeditor5#18745](https://github.com/ckeditor/ckeditor5/issues/18745).

### Other changes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Corrected an inconsistency in supported Node.js versions and set the minimum Node.js version to 22. See [ckeditor/ckeditor5#18500](https://github.com/ckeditor/ckeditor5/issues/18500).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/50.2.0): v50.1.2 => v50.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/50.2.0): v50.1.2 => v50.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/50.2.0): v50.1.2 => v50.2.0
</details>


## [50.1.2](https://github.com/ckeditor/ckeditor5-dev/compare/v50.1.1...v50.1.2) (June 18, 2025)

### Bug fixes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Added validation for a username provided in the community contributors section. Closes [ckeditor/ckeditor5#18670](https://github.com/ckeditor/ckeditor5/issues/18670).
* Downgrade `@rollup/plugin-typescript` to version `12.1.2` to fix failing builds. Closes [ckeditor/ckeditor5#18731](https://github.com/ckeditor/ckeditor5/issues/18731).

### Other changes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: When there are no changelog entries found, the changelog generator script informs about it in the terminal and exits. Closes [ckeditor/ckeditor5#18661](https://github.com/ckeditor/ckeditor5/issues/18661).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/50.1.2): v50.1.1 => v50.1.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/50.1.2): v50.1.1 => v50.1.2
</details>


## [50.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v50.1.0...v50.1.1) (June 11, 2025)

### Bug fixes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: The template file for the changelog entries generator is included in the published package to avoid issues when using the `ckeditor5-dev-changelog-create-entry` binary script. Closes [ckeditor/ckeditor5#18665](https://github.com/ckeditor/ckeditor5/issues/18665).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/50.1.1): v50.1.0 => v50.1.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/50.1.1): v50.1.0 => v50.1.1
</details>


## [50.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v50.0.0...v50.1.0) (June 10, 2025)

### Features

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Initial version of the `@ckeditor/ckeditor5-dev-changelog` package that uses markdown files as the source of changelogs instead of Git commits. Closes [ckeditor/ckeditor5#18051](https://github.com/ckeditor/ckeditor5/issues/18051).
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Created new namespaces: `workspaces` and `npm`.

  * `workspaces`  exposes the following functions:
    * `findPathsToPackages()`
    * `getPackageJson()`
    * `getRepositoryUrl()`
  * `npm` exposes the following functions:
    * `checkVersionAvailability()`
    * `manifest()` - a wrapper over the `packote` package that prevents using any cache
    * `packument()` - as above.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Added a new function to the `tools` namespace: `tools.commit()`. See [ckeditor/ckeditor5#18051](https://github.com/ckeditor/ckeditor5/issues/18051).

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `checkVersionAvailability()` and `findPathsToPackages()` functions exported by the `@ckeditor/ckeditor5-dev-release-tools` package have been moved to the `@ckeditor/ckeditor5-dev-utils` package.

  For backward compatibility, they are still available in the `@ckeditor/ckeditor5-dev-release-tools` package and will be removed in the next major release.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

New packages:

* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/50.1.0): v50.1.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/50.1.0): v50.0.0 => v50.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/50.1.0): v50.0.0 => v50.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/50.1.0): v50.0.0 => v50.1.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
