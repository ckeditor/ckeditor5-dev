Changelog
=========

## [44.0.0-alpha.0](https://github.com/ckeditor/ckeditor5-dev/compare/v43.0.0...v44.0.0-alpha.0) (2024-09-20)

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Convert ckeditor5-dev-release-tools to ESM. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/22d7d9d98de7983aa43f749a5b3697862c2c43c9))
* **[transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex)**: Converted ckeditor5-dev-transifex to ESM. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a37d6430b973ead4627fd51b0f4d0a8c24335455))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.0.0-alpha.0): v43.0.0 => v44.0.0-alpha.0
</details>


## [43.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v42.1.0...v43.0.0) (2024-09-09)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `git` and `workspace` objects are no longer exported from the package. Also, the following functions are no longer available in the `tools` object:

* `isDirectory()`
* `isFile()`
* `isSymlink()`
* `sortObject()`
* `readPackageName()`
* `npmInstall()`
* `npmUninstall()`
* `npmUpdate()`
* `copyTemplateFile()`
* `copyFile()`
* `getGitUrlFromNpm()`
* `removeSymlink()`
* `clean()`

### Other changes

* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: The dependency checker analyzes dependencies by including the `lib/` and `bin/` directories as production code. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e84c7019a61fa31c233e961afed014c1c9303989))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Removed several utilities functions non-used in the CKEditor 5 environment. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e84c7019a61fa31c233e961afed014c1c9303989))
* Added several missing `dependencies` and `devDependencies` in packages. Also, removed non-used ones. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e84c7019a61fa31c233e961afed014c1c9303989))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/43.0.0): v42.1.0 => v43.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/43.0.0): v42.1.0 => v43.0.0
</details>


## [43.0.0-alpha.0](https://github.com/ckeditor/ckeditor5-dev/compare/v42.1.0...v43.0.0-alpha.0) (2024-09-02)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `git` and `workspace` objects are no longer exported from the package. Also, the following functions are no longer available in the `tools` object:

* `isDirectory()`
* `isFile()`
* `isSymlink()`
* `sortObject()`
* `readPackageName()`
* `npmInstall()`
* `npmUninstall()`
* `npmUpdate()`
* `copyTemplateFile()`
* `copyFile()`
* `getGitUrlFromNpm()`
* `removeSymlink()`
* `clean()`

### Other changes

* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: The dependency checker analyzes dependencies by including the `lib/` and `bin/` directories as production code. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e84c7019a61fa31c233e961afed014c1c9303989))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Removed several utilities functions non-used in the CKEditor 5 environment. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e84c7019a61fa31c233e961afed014c1c9303989))
* Added several missing `dependencies` and `devDependencies` in packages. Also, removed non-used ones. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e84c7019a61fa31c233e961afed014c1c9303989))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/43.0.0-alpha.0): v42.1.0 => v43.0.0-alpha.0
</details>


## [42.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v42.0.1...v42.1.0) (2024-08-29)

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Introduced a new `loadSourcemaps` plugin for loading source maps of external dependencies. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/defb966ca3e090d062d173e5098a2325696491ec))

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Fixed source maps generation for the UMD build. Fixes [ckeditor/ckeditor5#16984](https://github.com/ckeditor/ckeditor5/issues/16984). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/defb966ca3e090d062d173e5098a2325696491ec))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/42.1.0): v42.0.1 => v42.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/42.1.0): v42.0.1 => v42.1.0
</details>


## [42.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v42.0.0...v42.0.1) (2024-08-13)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added a Chrome flag to prevent displaying the search engine choice screen that disrupts automated tests in windowed mode. Closes [ckeditor/ckeditor5#16825](https://github.com/ckeditor/ckeditor5/issues/16825). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4f7291f1f8114ed0184f11a51c74752c6d8ecaa9))

### Other changes

* **[stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot)**: Aligned stale bot to recent changes in the GitHub GraphQL API in the `repository.labels` connection. GitHub recently started returning a lot of mismatched labels for the query and now stale bot ensures that only the required ones are used. Closes [ckeditor/ckeditor5#16872](https://github.com/ckeditor/ckeditor5/issues/16872). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/666daf6cfe52b5ce63e7937168022eb86fcb4f9c))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/42.0.1): v42.0.0 => v42.0.1
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
