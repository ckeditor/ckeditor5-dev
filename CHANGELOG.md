Changelog
=========

## [55.0.0-alpha.0](https://github.com/ckeditor/ckeditor5-dev/compare/v54.3.0...v55.0.0-alpha.0) (January 14, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests), [utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Remove tools used to handle and generate DLLs for “old installation methods” in CKEditor 5. See [ckeditor/ckeditor5#17779](https://github.com/ckeditor/ckeditor5/issues/17779).
* Upgrade TypeScript to `v5.5.4`.

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Fixed the `build()` function producing duplicated banners outside the `translations` directory.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.0.0-alpha.0): v54.3.0 => v55.0.0-alpha.0
</details>


## [54.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v54.2.3...v54.3.0) (January 13, 2026)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `prepareRepository()` task now applies `publishConfig` overrides directly to copied `package.json` files. Closes [ckeditor/ckeditor5#19608](https://github.com/ckeditor/ckeditor5/issues/19608).

  Fields defined in `publishConfig` replace their top-level counterparts in the final manifest, and the `publishConfig` field itself is removed from the published file.

### Other changes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Automatically normalize the `see` and `closes` fields from changelog entry into arrays when they are literal values. Closes [ckeditor/ckeditor5#19470](https://github.com/ckeditor/ckeditor5/issues/19470).
* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Treat updated English translations in the `t()` calls as new messages to translate in other languages.

  In the past, the translation tooling assumed that English translation passed to the `t( { id: '...', string: '...' } )` function in the `string` key would not be changed. In reality, this assumption is not true and leads to outdated translations in all `*.po` files. Now, when synchronizing the translations, the tooling detects updated English translations in the source code and treats them as new messages to translate.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.3.0): v54.2.3 => v54.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.3.0): v54.2.3 => v54.3.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.3.0): v54.2.3 => v54.3.0
</details>


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

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
