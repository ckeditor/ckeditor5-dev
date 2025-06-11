Changelog
=========

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


## [50.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v49.0.2...v50.0.0) (2025-06-09)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* Updated the required version of Node.js to 22.

### Features

* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Added the `checkVersionMatch()` function, which verifies if all the dependency versions defined in `package.json` are consistent across the entire repository. Closes [ckeditor/ckeditor5#18579](https://github.com/ckeditor/ckeditor5/issues/18579). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/55ed171024c42819187d1650cbcadd33aabe9f1f))

### Other changes

* The repository now uses ESLint v9. Therefore, the required Node.js version has been upgraded to 22 to match the ESLint requirements. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/93bdfb37f520c3387d93365e3a4433b5f74fbc01))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/50.0.0): v49.0.2 => v50.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/50.0.0): v49.0.2 => v50.0.0
</details>


## [49.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/v49.0.1...v49.0.2) (2025-05-19)

### Bug fixes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Fixed rendering values of the `@default` tag in API docs. Previously, TypeDoc tried to guess whether the `@default` tag value should be treated as a code, which produced invalid outputs in some cases. Now it just takes the value from this tag and renders it as inline code. Closes [ckeditor/ckeditor5#18526](https://github.com/ckeditor/ckeditor5/issues/18526). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c95b47db5d533e7005c563a095e676bada2dbab2))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/49.0.2): v49.0.1 => v49.0.2
</details>


## [49.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v49.0.0...v49.0.1) (2025-05-14)

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Fixed `commitAndTag()` throwing an `ENAMETOOLONG` error when trying to commit a large number of files on Windows. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/31b44c4756eed390710809d6d133b6cab90ff5a2))

### Other changes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Ignore the requests related to the "if-cdn.com" service. Closes [ckeditor/ckeditor5#18519](https://github.com/ckeditor/ckeditor5/issues/18519). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/fef9e101c3a95e14fa48b8afa909e99b120e1e8b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/49.0.1): v49.0.0 => v49.0.1
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
