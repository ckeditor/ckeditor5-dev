Changelog
=========

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


## [44.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v44.1.0...v44.1.1) (2024-10-16)

> [!NOTE]
> The release channel for this release is `next`.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Added a missing dependency (simple-git). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/914436ff2d14b8e44a767a8c66a3d36fe832158b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.1.1): v44.1.0 => v44.1.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.1.1): v44.1.0 => v44.1.1
</details>


## [44.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v44.0.0...v44.1.0) (2024-10-15)

> [!NOTE]
> The release channel for this release is `next`.

### Features

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Created a new binary script called `ckeditor5-dev-ci-is-workflow-restarted` that returns with a non-zero exit code if a given workflow is executed for the first time. The restarted workflows exit with a zero exit code. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ff7d7387cc46fc24d7992178f331f29df50f7e53))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: A user-provided version will be checked against npm availability while generating a changelog. If it is already taken, the tools will not allow it to be used. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ff7d7387cc46fc24d7992178f331f29df50f7e53))

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `updateVersions()` task will no longer verify if the specified `version` is available on npm. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ff7d7387cc46fc24d7992178f331f29df50f7e53))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `publishPackages()` task filters out already published packages to avoid pushing the same archive twice. Thanks to that, it can be a part of a process that would be restarted. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ff7d7387cc46fc24d7992178f331f29df50f7e53))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `publishPackages()` task tries to publish the package once again when it fails independently of the returned error code. Previously, it was scheduled only when the `E409` error occurred. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ff7d7387cc46fc24d7992178f331f29df50f7e53))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Marked the `verifyPackagesPublishedCorrectly()` function is deprecated. Its responsibility has been merged with `publishPackages()`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ff7d7387cc46fc24d7992178f331f29df50f7e53))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `commitAndTag()` task does not commit files if a tag for the specified version is already created. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ff7d7387cc46fc24d7992178f331f29df50f7e53))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: We do not spawn an npm process to download a package manifest from the npm registry. Instead, we send an HTTP request using the `pacote` package. Closes [ckeditor/ckeditor5#17191](https://github.com/ckeditor/ckeditor5/issues/17191). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a155390a2ee45190ce6edc49ed48f8e871aa641f))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `getNpmTagFromVersion()` function returns a `'nightly'` string when passing a CKEditor 5 nightly version. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4edf71cade5c73a8f9a7dbf80994490eeb400b60))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/44.1.0): v44.0.0 => v44.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/44.1.0): v44.0.0 => v44.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/44.1.0): v44.0.0 => v44.1.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
