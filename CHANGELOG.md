Changelog
=========

## [44.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v43.0.0...v44.0.0) (2024-10-02)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: The package uses only TypeDoc to build the documentation. The `build()` function no longer supports `type` property in the configuration.
* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: An array of ignored files must be specified as `ignoreFiles` instead of negating a glob pattern in `sourceFiles`.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The IntelliJ Karma configuration path needs to be updated. Now, it ends with the `cjs` suffix instead of `js`.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `builds.getDllPluginWebpackConfig()` function is now asynchronous now.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The following functions from the `bundler` object are no longer available: `createEntryFile()`, `getEditorConfig()`, `getPlugins()`.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The following functions from the `stream` object are no longer available: `isTestFile()`, `isSourceFile()`, `isJSFile()`.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `styles.themeLogger()` function is no longer exposed publicly.
* The following packages have been converted to ESM. To load them, use an `import` statement instead of `require()`.
  * [`@ckeditor/ckeditor5-dev-bump-year`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year)
  * [`@ckeditor/ckeditor5-dev-ci`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)
  * [`@ckeditor/ckeditor5-dev-dependency-checker`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)
  * [`@ckeditor/ckeditor5-dev-docs`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)
  * [`@ckeditor/ckeditor5-dev-release-tools`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)
  * [`@ckeditor/ckeditor5-dev-stale-bot`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot)
  * [`@ckeditor/ckeditor5-dev-tests`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)
  * [`@ckeditor/ckeditor5-dev-transifex`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex)
  * [`@ckeditor/ckeditor5-dev-translations`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)
  * [`@ckeditor/ckeditor5-dev-utils`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)
  * [`@ckeditor/ckeditor5-dev-web-crawler`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Allow defining a main branch when generating the changelog entries. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/8b5078e67ebbbe9e8a5a952fa18646dfca6a2563))

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Passing an odd number as a value of the `concurrency` option will not crash the `executeInParallel()` function. Closes [ckeditor/ckeditor5#17025](https://github.com/ckeditor/ckeditor5/issues/17025). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/50c744ea27f6a41c42f18c85e87082e66d146b4b))

### Other changes

* The CKEditor 5 Dev packages are now ESM. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/50c744ea27f6a41c42f18c85e87082e66d146b4b))
* The `@ckeditor/jsdoc-plugins` package is no longer available as CKEditor 5 documentation uses TypeScript sources to prepare API docs. The package is no longer use by us anywhere. Hence, we decided to remove a dead code. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/50c744ea27f6a41c42f18c85e87082e66d146b4b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.0.0): v43.0.0 => v44.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.0.0): v43.0.0 => v44.0.0
</details>


## [44.0.0-alpha.5](https://github.com/ckeditor/ckeditor5-dev/compare/v44.0.0-alpha.4...v44.0.0-alpha.5) (2024-09-24)

### Other changes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Restored the previous version of the "puppeteer" package as the latest version is not too stable. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/3c2df981b960e20d4de943f527375dc408a425d7))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.0.0-alpha.5): v44.0.0-alpha.4 => v44.0.0-alpha.5
</details>


## [44.0.0-alpha.4](https://github.com/ckeditor/ckeditor5-dev/compare/v44.0.0-alpha.3...v44.0.0-alpha.4) (2024-09-24)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Prevent crashing the manual test server when reading a non-existing file due to an "ERR_HTTP_HEADERS_SENT" Node.js error. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/15a8f79e15a69ad4cec8365cb5d86cd731ba1953))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Use `jsonValue()` method to get the serialized arguments instead of calling `evaluate()` method, which may cause unhandled rejection due to destroyed context. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c89444e9598bffbd7b3d1070df607ac05d54c2d9))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.0.0-alpha.4): v44.0.0-alpha.3 => v44.0.0-alpha.4
</details>


## [44.0.0-alpha.3](https://github.com/ckeditor/ckeditor5-dev/compare/v44.0.0-alpha.2...v44.0.0-alpha.3) (2024-09-23)

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Downgrade the "sinon" package as it is not compatible with current CKEditor 5 tests. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e94009abd804176cc381b9bac3de42b1da0db3da))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Aligned internals to the latest Puppeteer API. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d70d99ffeed4609de954bae936e6f01875ded5a8))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.0.0-alpha.3): v44.0.0-alpha.2 => v44.0.0-alpha.3
</details>


## [44.0.0-alpha.2](https://github.com/ckeditor/ckeditor5-dev/compare/v44.0.0-alpha.1...v44.0.0-alpha.2) (2024-09-23)

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Support for passing an array of files to ignore when preparing API. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/3c858289a5826c9fceddfb380a4e35d48b44a099))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Restored the previous version of Chai and sinon-chai packages due to issues with processing ESM in Karma. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/833ac929e4193b6791c79cdc5df05e67539c0c7f))
* Use the "2021" edition as a default preset for CKEditor 5 files (`postcss-nesting`). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ce3902d5855f1b3ba886dea1db195a5b27e22026))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.0.0-alpha.2): v44.0.0-alpha.1 => v44.0.0-alpha.2
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
