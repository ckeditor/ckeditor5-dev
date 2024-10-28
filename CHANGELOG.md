Changelog
=========

## [45.0.6](https://github.com/ckeditor/ckeditor5-dev/compare/v45.0.5...v45.0.6) (2024-10-28)

> [!NOTE]
> The release channel for this release is `next`.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `publishPackages()` task should not throw an error after trying to publish packages after reaching an attempted limit. Instead, it should verify if the last try was successfully completed and throw the error if it wasn't. Closes [ckeditor/ckeditor5#17333](https://github.com/ckeditor/ckeditor5/issues/17333). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/937c093d9993c4a43efb9de673b2fb492c152bd0))

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Increased the attempts limit from 3 to 5. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/937c093d9993c4a43efb9de673b2fb492c152bd0))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Created a decorated version of utils (`manifest()`, `packument()`) exposed by the `pacote` package. It prevents from using any cache when checking the npm registry. Direct calls have been replaced with the decorated version. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/937c093d9993c4a43efb9de673b2fb492c152bd0))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/45.0.6): v45.0.5 => v45.0.6
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/45.0.6): v45.0.5 => v45.0.6
</details>


## [45.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/v45.0.4...v45.0.5) (2024-10-25)

> [!NOTE]
> The release channel for this release is `next`.

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Slow down the `npm publish` command due to weird errors on CI. Closes [ckeditor/ckeditor5#17331](https://github.com/ckeditor/ckeditor5/issues/17331). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4cfcf41e243687af88478337faebed0cfef4ecae))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Support for the `silent` logger mode. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4cfcf41e243687af88478337faebed0cfef4ecae))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/45.0.5): v45.0.4 => v45.0.5
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/45.0.5): v45.0.4 => v45.0.5
</details>


## [45.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/v45.0.3...v45.0.4) (2024-10-25)

> [!NOTE]
> The release channel for this release is `next`.

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Increases the timeout value between the publishing packages phase and republishing the failed ones. Closes [ckeditor/ckeditor5#17329](https://github.com/ckeditor/ckeditor5/issues/17329). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/1fafa92b4a201ab70cca8e8e4e46743f179d2b86))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/45.0.4): v45.0.3 => v45.0.4
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/45.0.4): v45.0.3 => v45.0.4
</details>


## [45.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/v45.0.2...v45.0.3) (2024-10-25)

> [!NOTE]
> The release channel for this release is `next`.

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Do not use the cached values when asking the npm registry about a package. Closes [ckeditor/ckeditor5#17328](https://github.com/ckeditor/ckeditor5/issues/17328). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/42f5c98b01d2dbd84f55ad56ee0580c9ddfd7d31))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/45.0.3): v45.0.2 => v45.0.3
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/45.0.3): v45.0.2 => v45.0.3
</details>


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

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
