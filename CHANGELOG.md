Changelog
=========

## [45.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/v45.0.1...v45.0.2) (2024-10-25)

> [!NOTE]
> The release channel for this release is `next`.

### Bug fixes

* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Fixed the `synchronizeTranslations()` function to fill new translation entries for English in `en.po` with texts collected from the source code. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6188a508fcab74d458419ee60aeb788140cd6bd0))

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `publishPackageOnNpmCallback()` util does not remove a package directory even if npm says it was published. Closes [ckeditor/ckeditor5#17322](https://github.com/ckeditor/ckeditor5/issues/17322). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a1b37c79347a7f74f88f6d945526e90b8ea96a67))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/45.0.2): v45.0.1 => v45.0.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/45.0.2): v45.0.1 => v45.0.2
</details>


## [45.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v45.0.0...v45.0.1) (2024-10-23)

> [!NOTE]
> The release channel for this release is `next`.

### Bug fixes

* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Align the number of plural forms to plural forms defined by a language in the `synchronizeTranslations()` function. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/34bf2fd9234c7b8f1c768a810d970b0f29bc7f16))

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `commitAndTag()` function understands a new parameter called `skipCi`. By default, release commits will not trigger a new workflow on CI. This behavior can be disabled when passing the `false` value. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ecc5104212b4c4c96f7530db5c384ca45fa67fa8))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/45.0.1): v45.0.0 => v45.0.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/45.0.1): v45.0.0 => v45.0.1
</details>


## [45.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v44.2.1...v45.0.0) (2024-10-22)

> [!NOTE]
> The release channel for this release is `next`.

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `verifyPackagesPublishedCorrectly()` function is no longer available. Consider using the `publishPackages()` function, which includes its responsibility.
* **[transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex)**: Removed the `@ckeditor/ckeditor5-dev-transifex` package as it is no longer used.
* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: The `cleanPoFileContent()` and `createDictionaryFromPoFileContent()` functions are no longer available due to removal integration with the Transifex service.

### Features

* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Introduced `moveTranslations()` function to move requested translations between packages. It removes contexts and translated messages from language files (`*.po` files) from the source package and adds (or overwrites) them in the destination package. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a53514d3bc18b7c594b64de176d66477c55e9ad8))
* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Introduced `synchronizeTranslations()` function to synchronize translations (stored in `*.po` files in packages) with context files. It validates translation contexts against the source messages and performs synchronization by removing unused entries, adding missing entries, and creating missing `*.po` files. If the `options.validateOnly` flag is set, no translation files are updated, and only validation is performed. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a53514d3bc18b7c594b64de176d66477c55e9ad8))

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `verifyPackagesPublishedCorrectly()` task is no longer available as its responsibility has been merged into the `publishPackages()` task. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a53514d3bc18b7c594b64de176d66477c55e9ad8))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/45.0.0): v44.2.1 => v45.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/45.0.0): v44.2.1 => v45.0.0
</details>


## [44.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v44.2.0...v44.2.1) (2024-10-17)

> [!NOTE]
> The release channel for this release is `next`.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `getNpmTagFromVersion()` function handles internal releases correctly. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/baad1a6ae3b3fe0ff0b4711ae04067d44f128c92))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.2.1): v44.2.0 => v44.2.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.2.1): v44.2.0 => v44.2.1
</details>


## [44.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v44.1.1...v44.2.0) (2024-10-17)

> [!NOTE]
> The release channel for this release is `next`.

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Created a new util exposed as `getNextInternal()` to generate an internal release version, e.g. `0.0.0-internal-20240102.0`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/38346c679a8cb7ce328a9584a18529110f641325))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.2.0): v44.1.1 => v44.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.2.0): v44.1.1 => v44.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.2.0): v44.1.1 => v44.2.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
