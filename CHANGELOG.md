Changelog
=========

## [48.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v47.1.1...v48.0.0) (2025-04-22)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Bump `puppeteer` to `^24.0.0`.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Renamed the `noSpinner` option to `silent`.

### Features

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Improved performance, allowing the time needed to process the entire CKEditor 5 documentation to be reduced by about 90% (from 50 min to 5). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c98845a3f34364632d2d70d1828d945b6c7c0341))

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Fixed the `push()` task having erroneously escaped tag. Closes [ckeditor/ckeditor5#18354](https://github.com/ckeditor/ckeditor5/issues/18354). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/be77674b3d90ad04eaa76d2992a6c5cba64f1f50))

### Other changes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Support for jobs with the "skipped" status. Closes [ckeditor/ckeditor5#18359](https://github.com/ckeditor/ckeditor5/issues/18359). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/06188327b07a9ee209089725bd9c0fcbd268b73b))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Update the `puppeteer` package to the latest version. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/25ba28ef210b24351d2712c783315a2b8c939d1d))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Ignore errors from a predefined list of external hosts used in CKEditor 5 documentation and manual tests. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/25ba28ef210b24351d2712c783315a2b8c939d1d))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: The package sources are now written in TypeScript. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/25ba28ef210b24351d2712c783315a2b8c939d1d))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/48.0.0): v47.1.1 => v48.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/48.0.0): v47.1.1 => v48.0.0
</details>


## [47.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v47.1.0...v47.1.1) (2025-04-03)

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Prioritize `.ts` over `.js` files. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/747f9f3ef1ed0bcac2becf6a97198692e89efbe8))

### Other changes

* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Added the Belarusian language to the supported list. Closes [ckeditor/ckeditor5#18229](https://github.com/ckeditor/ckeditor5/issues/18229). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/9b346cbea65a47ad21afd70a7325de638e1164ed))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/47.1.1): v47.1.0 => v47.1.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/47.1.1): v47.1.0 => v47.1.1
</details>


## [47.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v47.0.0...v47.1.0) (2025-03-19)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Print more coverage information on CI. Related to [ckeditor/ckeditor5#18034](https://github.com/ckeditor/ckeditor5/issues/18034). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/48aeff6c293c79e8a3cab2c590ab3dfb8ebdcc7b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/47.1.0): v47.0.0 => v47.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/47.1.0): v47.0.0 => v47.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/47.1.0): v47.0.0 => v47.1.0
</details>


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

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
