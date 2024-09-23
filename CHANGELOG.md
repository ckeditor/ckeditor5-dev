Changelog
=========

## [44.0.0-alpha.1](https://github.com/ckeditor/ckeditor5-dev/compare/v44.0.0-alpha.0...v44.0.0-alpha.1) (2024-09-23)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Allow defining a main branch when generating the changelog entries. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/8b5078e67ebbbe9e8a5a952fa18646dfca6a2563))

### Other changes

* Almost all dependencies of `ckeditor5-dev-*` packages have been bumped to their latest versions. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/2358a19113eb80f6204f39a1d0e0411810283ef2))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.0.0-alpha.1): v44.0.0-alpha.0 => v44.0.0-alpha.1
</details>


## [44.0.0-alpha.0](https://github.com/ckeditor/ckeditor5-dev/compare/v43.0.0...v44.0.0-alpha.0) (2024-09-20)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `builds.getDllPluginWebpackConfig()` function is now asynchronous now.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The following functions from the `bundler` object are no longer available: `createEntryFile()`, `getEditorConfig()`, `getPlugins()`.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The following functions from the `stream` object are no longer available: `isTestFile()`, `isSourceFile()`, `isJSFile()`.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `styles.themeLogger()` function is no longer exposed publicly.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The IntelliJ Karma configuration path needs to be updated. Now, it ends with the `cjs` suffix instead of `js`.
* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: The package uses only TypeDoc to build the documentation. The `build()` function no longer supports `type` property in the configuration.
* The following packages have been converted to ESM. To load them, use an `import` statement instead of `require()`.
  * [`@ckeditor/ckeditor5-dev-build-tools`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-build-tools)
  * [`@ckeditor/ckeditor5-dev-bump-year`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-bump-year)
  * [`@ckeditor/ckeditor5-dev-ci`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-ci)
  * [`@ckeditor/ckeditor5-dev-dependency-checker`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-dependency-checker)
  * [`@ckeditor/ckeditor5-dev-docs`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-docs)
  * [`@ckeditor/ckeditor5-dev-release-tools`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-release-tools)
  * [`@ckeditor/ckeditor5-dev-stale-bot`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-stale-bot)
  * [`@ckeditor/ckeditor5-dev-tests`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-tests)
  * [`@ckeditor/ckeditor5-dev-transifex`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-transifex)
  * [`@ckeditor/ckeditor5-dev-translations`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-translations)
  * [`@ckeditor/ckeditor5-dev-utils`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-utils)
  * [`@ckeditor/ckeditor5-dev-web-crawler`](https://www.npmjs.com/package/@ckeditor/@ckeditor/ckeditor5-dev-web-crawler)

### Other changes

* The CKEditor 5 Dev packages are now ESM.
* The `@ckeditor/jsdoc-plugins` package is no longer available as CKEditor 5 documentation uses TypeScript sources to prepare API docs. The package is no longer use by us anywhere. Hence, we decided to remove a dead code.

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

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
