Changelog
=========

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


## [54.3.3](https://github.com/ckeditor/ckeditor5-dev/compare/v54.3.2...v54.3.3) (February 3, 2026)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Unify error handling in `ckeditor5-dev-tests-run-automated` and `ckeditor5-dev-tests-run-manual` to prevent a `TypeError` when test execution fails.

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Unified Chrome launch configuration across _headless_ and _headed_ mode and enforced a `1920x1080` window size for consistent and predictable test results.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.3.3): v54.3.2 => v54.3.3
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.3.3): v54.3.2 => v54.3.3
</details>


## [54.3.2](https://github.com/ckeditor/ckeditor5-dev/compare/v54.3.1...v54.3.2) (January 21, 2026)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Fixed the license key configuration for manual tests which was blocked by Content Security Policy rules. Closes [ckeditor/ckeditor5#19643](https://github.com/ckeditor/ckeditor5/issues/19643).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.3.2): v54.3.1 => v54.3.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.3.2): v54.3.1 => v54.3.2
</details>


## [54.3.1](https://github.com/ckeditor/ckeditor5-dev/compare/v54.3.0...v54.3.1) (January 20, 2026)

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Keep the trailing blank line at the end of modified files tracked by Git. Closes [ckeditor/ckeditor5#19611](https://github.com/ckeditor/ckeditor5/issues/19611).

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Automatically load a license key from the `<process.cwd()>/.env` file (defined in `CKEDITOR_LICENSE_KEY` variable) for automated and manual tests.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/54.3.1): v54.3.0 => v54.3.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/54.3.1): v54.3.0 => v54.3.1
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
