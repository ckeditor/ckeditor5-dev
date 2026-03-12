Changelog
=========

## [55.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v55.0.0-alpha.5...v55.0.0) (March 12, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests), [utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Remove tools used to handle and generate DLLs for “old installation methods” in CKEditor 5. See [ckeditor/ckeditor5#17779](https://github.com/ckeditor/ckeditor5/issues/17779).
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `styles.themeImporter()` helper is no longer available.
* Upgrade TypeScript to `v5.5.4`.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools), [utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Remove support for PostCSS mixins, as they are no longer used in CKEditor 5 codebase.
* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools), [utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Following our migration away from PostCSS features, we have replaced PostCSS with [LightningCSS](https://lightningcss.dev/) in our build tools. This changes the specificity of the generated CSS selectors, which now reflect how native CSS nesting works.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Remove the `styles` export from the `ckeditor5-dev-utils` package.

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Added a `disallowLatestNpmTag` option to `publishPackages()` and npm tag validation so release workflows can explicitly block publishing with the `latest` [dist-tag](https://docs.npmjs.com/cli/commands/npm-dist-tag). Closes [ckeditor/ckeditor5#19952](https://github.com/ckeditor/ckeditor5/issues/19952).

  When enabled, attempting to publish with `npmTag: 'latest'` now fails before publishing starts.

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Fixed the `build()` function producing duplicated banners outside the `translations` directory.
* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Improve detection of the nested `ck-content` classes, so that `*-content.css` stylesheets contain all the necessary styles.

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The testing environment no longer consumes the `themePath` option in both test runner tasks.

  Previously `themePath` was hardcoded to `@ckeditor/ckeditor5-theme-lark`.
* This is a sync release that brings changes from [v54.3.4](https://github.com/ckeditor/ckeditor5-dev/releases/tag/v54.3.4) to the `@alpha` channel (`v55.0.0-alpha.4`).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.0.0): v55.0.0-alpha.5 => v55.0.0

Minor releases (contain minor breaking changes):

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.0.0): v55.0.0-alpha.5 => v55.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.0.0): v55.0.0-alpha.5 => v55.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.0.0): v55.0.0-alpha.5 => v55.0.0
</details>


## [54.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v54.3.4...v54.4.0) (March 11, 2026)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `createGithubRelease()` task now accepts an `isLatest` option (defaults to `true`) that controls whether the GitHub release is marked as the latest. Set it to `false` to publish a release without overwriting the "latest" label - useful when maintaining older major branches alongside a newer one. Closes [ckeditor/ckeditor5#19929](https://github.com/ckeditor/ckeditor5/issues/19929).
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Added support for publishing stable releases with the `latest-v{X}` dist-tag, including strict validation that the tag major matches the released version major. Closes [ckeditor/ckeditor5#19874](https://github.com/ckeditor/ckeditor5/issues/19874).

  Existing tag behavior (`latest`, `staging`, `next`, pre-release tags, and custom tags) remains backward compatible.

### Other changes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Retry pages that report errors (not just Puppeteer task/page crashes) with a 1s delay between attempts to reduce flaky failures from transient network and temporary issues.
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Lower page timeout time to 20 seconds.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.4.0): v54.3.4 => v54.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.4.0): v54.3.4 => v54.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.4.0): v54.3.4 => v54.4.0
</details>


## [55.0.0-alpha.5](https://github.com/ckeditor/ckeditor5-dev/compare/v55.0.0-alpha.4...v55.0.0-alpha.5) (February 19, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `styles.themeImporter()` helper is no longer available.

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The testing environment no longer consumes the `themePath` option in both test runner tasks.

  Previously `themePath` was hardcoded to `@ckeditor/ckeditor5-theme-lark`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.0.0-alpha.5): v55.0.0-alpha.4 => v55.0.0-alpha.5
</details>


## [55.0.0-alpha.4](https://github.com/ckeditor/ckeditor5-dev/compare/v55.0.0-alpha.3...v55.0.0-alpha.4) (February 11, 2026)

### Other changes

* This is a sync release that brings changes from [v54.3.4](https://github.com/ckeditor/ckeditor5-dev/releases/tag/v54.3.4) to the `@alpha` channel (`v55.0.0-alpha.4`).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.0.0-alpha.4): v55.0.0-alpha.3 => v55.0.0-alpha.4
</details>


## [54.3.4](https://github.com/ckeditor/ckeditor5-dev/compare/v54.3.3...v54.3.4) (February 11, 2026)

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Always log TypeScript errors, even when the `declarations` option is not set or `false`.
* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Made `ckeditor5-dev-ci-circle-workflow-notifier` resilient to unstable CircleCI API responses by adding retries, response shape validation, and clearer hard-fail reasons. Closes [ckeditor/ckeditor5#19763](https://github.com/ckeditor/ckeditor5/issues/19763).

  The notifier now retries transient API failures up to 5 times with delays, fails fast for non-retryable API errors, and reports when manual workflow verification is required.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.3.4): v54.3.3 => v54.3.4
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.3.4): v54.3.3 => v54.3.4
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
