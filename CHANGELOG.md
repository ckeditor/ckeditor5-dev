Changelog
=========

## [54.2.3](https://github.com/ckeditor/ckeditor5-dev/compare/v54.2.2...v54.2.3) (December 22, 2025)

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Resolve a race condition in the release preparation process where nested files defined in the `#files` glob pattern could trigger the `EEXIST` error. Closes [ckeditor/ckeditor5#19550](https://github.com/ckeditor/ckeditor5/issues/19550).

  Copying files is now performed sequentially using a `for...of` loop instead of `Array#map()`, ensuring that directories are created deterministically before each copy operation.

  This change improves the stability of `prepareRepository()` when handling deeply nested or overlapping glob patterns.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.2.3): v54.2.2 => v54.2.3
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.2.3): v54.2.2 => v54.2.3
</details>


## [54.2.2](https://github.com/ckeditor/ckeditor5-dev/compare/v54.2.1...v54.2.2) (December 15, 2025)

### Other changes

* The `@latest` versions of `@ckeditor/ckeditor5-dev-*` packages (e.g., [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)) now point to the most recent stable packages published under the `latest` npm [dist-tag](https://docs.npmjs.com/cli/v8/commands/npm-dist-tag), ensuring they no longer depend on outdated libraries with known vulnerabilities. See [ckeditor/ckeditor5#19492](https://github.com/ckeditor/ckeditor5/issues/19492).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.2.2): v54.2.1 => v54.2.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.2.2): v54.2.1 => v54.2.2
</details>


## [54.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v54.2.0...v54.2.1) (December 3, 2025)

### Bug fixes

* **[stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot)**: Fixed stale bot not working due to using deprecated `fs.exists()`. Closes [ckeditor/ckeditor5#19465](https://github.com/ckeditor/ckeditor5/issues/19465).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.2.1): v54.2.0 => v54.2.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.2.1): v54.2.0 => v54.2.1
</details>


## [54.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v54.1.0...v54.2.0) (November 26, 2025)

### Features

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: `generateChangelogForSingleRepository()` and `generateChangelogForMonoRepository()` will now provide examples based on the actual current version when asking user about release type. Closes [ckeditor/ckeditor5#19138](https://github.com/ckeditor/ckeditor5/issues/19138).

### Bug fixes

* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Does not throw an error when the package does not have a `lags/contexts.json` file.

### Other changes

* Upgrade `glob` to version `13.0.0`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.2.0): v54.1.0 => v54.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.2.0): v54.1.0 => v54.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.2.0): v54.1.0 => v54.2.0
</details>


## [54.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v54.0.0...v54.1.0) (November 20, 2025)

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Added support in the `cleanUpPackages()` util for defining a nested field to remove from `package.json` file.
* Remove `chalk` from `dependencies`.
* Remove `fs-extra` from `dependencies`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.1.0): v54.0.0 => v54.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.1.0): v54.0.0 => v54.1.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
