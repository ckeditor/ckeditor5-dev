Changelog
=========

## [47.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v46.1.0...v47.0.0) (2025-03-12)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* Upgraded the minimal version of Node.js to 20.0.0 due to the end of LTS.

### Other changes

* Updated the required version of Node.js to 20. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/440b2bbedeb255c640fefa9497c1a78fc204506d))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/47.0.0): v46.1.0 => v47.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/47.0.0): v46.1.0 => v47.0.0
</details>


## [46.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v46.0.7...v46.1.0) (2025-03-06)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Added the options.dryRun parameter to the commitAndTag() function to verify if a release commit passes validation, so releasing a project will not fail due to issues while committing. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0e4779d403fbf22dd6f8a3f2a1de5d1b2183db81))

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `commitAndTag()` function now uses annotated tags instead of lightweight ones to allow signing tags while preparing a release. Closes [ckeditor/ckeditor5#18080](https://github.com/ckeditor/ckeditor5/issues/18080). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ecbcfd3a6767b1251400e67659ae326fa44b868a))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/46.1.0): v46.0.7 => v46.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/46.1.0): v46.0.7 => v46.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/46.1.0): v46.0.7 => v46.1.0
</details>


## [46.0.7](https://github.com/ckeditor/ckeditor5-dev/compare/v46.0.6...v46.0.7) (2025-03-04)

### Other changes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Added the `logLevel` option that allows hiding logs displayed during the build process. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e926a5c785c6445fc218a80903580376eb9e13ec))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/46.0.7): v46.0.6 => v46.0.7
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/46.0.7): v46.0.6 => v46.0.7
</details>


## [46.0.6](https://github.com/ckeditor/ckeditor5-dev/compare/v46.0.5...v46.0.6) (2025-02-26)

### Other changes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Added support for providing custom current working directory. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/65a3b40142ede24c581dcd4fa3e65706de35ad33))
* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Do not start generating UMD build if both `browser` and `name` parameters are missing, because both are required. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/65a3b40142ede24c581dcd4fa3e65706de35ad33))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/46.0.6): v46.0.5 => v46.0.6
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/46.0.6): v46.0.5 => v46.0.6
</details>


## [46.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/v46.0.4...v46.0.5) (2025-02-24)

### Bug fixes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Ignore false positive `net::ERR_ABORTED` error reported when POST request responds with 204 HTTP status code. Closes [ckeditor/ckeditor5#17969](https://github.com/ckeditor/ckeditor5/issues/17969). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a805689307a87e8175997fcd79ef15e389f6217d))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/46.0.5): v46.0.4 => v46.0.5
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/46.0.5): v46.0.4 => v46.0.5
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
