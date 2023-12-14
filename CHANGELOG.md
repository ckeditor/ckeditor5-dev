Changelog
=========

## [39.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.3.0...v39.4.0) (2023-12-14)

### Features

* **[stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot)**: Introduced a "stale" bot, which can be executed using the `yarn run ckeditor5-dev-stale-bot [<args>...]` command. It searches for issues and pull requests that are not active enough and then mark them as stale. Stale issues and pull requests are closed after a defined period of time or, if they become active again, they are unstaled by the bot. See [ckeditor/ckeditor5#15399](https://github.com/ckeditor/ckeditor5/issues/15399). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f2afff238f43a699048fbca15d432260652e963f))

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Added support in the `Logger#error()` method to print in console an error instance, if provided as the second argument. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f2afff238f43a699048fbca15d432260652e963f))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

New packages:

* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/39.4.0): v39.4.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.4.0): v39.3.0 => v39.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.4.0): v39.3.0 => v39.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.4.0): v39.3.0 => v39.4.0
</details>


## [39.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.2.1...v39.3.0) (2023-12-06)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Allow defining the date format while preparing the changelog file. See [ckeditor/ckeditor5#15429](https://github.com/ckeditor/ckeditor5/issues/15429). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c556c7035c9a88204c908458da8260908ec75d2f))
* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Compilation asset callback is now an optional field called `assetNamesFilter` in the object passed to the `CKEditorTranslationsPlugin` class. Thanks to that, it improves webpack compilation performance by filtering unrelated assets to reduce `TranslationService.getAssets()` calls. It only affects apps with many webpack entries and/or chunks. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4b4a22b4a3a1a4b518404773f228b492c660645c))

  Thanks to [@BreyndotEchse](https://github.com/BreyndotEchse).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.3.0): v39.2.1 => v39.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.3.0): v39.2.1 => v39.3.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.3.0): v39.2.1 => v39.3.0
</details>


## [39.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v39.2.0...v39.2.1) (2023-11-08)

### Bug fixes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Typedoc linker validator should not emit a warning when a link points to a property defined as children of the `type` declaration. Closes [ckeditor/ckeditor5#15321](https://github.com/ckeditor/ckeditor5/issues/15321). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/985ace5969a64b03dab8c686746e1aeebc252597))

### Other changes

* **[bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year)**: The bump year script supports both _hyphen_ and _en dash_ symbols in the year range. Closes [ckeditor/ckeditor5#15286](https://github.com/ckeditor/ckeditor5/issues/15286). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/255c1e83ea649ee1e702e40d235b2e09cd80de11))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.2.1): v39.2.0 => v39.2.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.2.1): v39.2.0 => v39.2.1
</details>


## [39.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.1.0...v39.2.0) (2023-10-19)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `publishPackages()` task accepts new options to ensure that packages define an entry point before publishing a new release. Closes [ckeditor/ckeditor5#15127](https://github.com/ckeditor/ckeditor5/issues/15127). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/30ea8aa127d2dc5af17232bc52346ad274276da1))

  By default, the validator is disabled, but it can be changed by passing the `requireEntryPoint: true` value in the options object. Additionally, if any package does not define an entry point, the validator can skip such package by specifying its full name in the `optionalEntryPointPackages` array.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Fixed the `transformCommitUtils.linkToGithubIssue()` function to correctly match GitHub issue references that could look similar to HEX colors. Closes [ckeditor/ckeditor5#14941](https://github.com/ckeditor/ckeditor5/issues/14941). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6cde55160b1b0b48b3d6e10351bd4b577a84e1b4))

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Removed a caret range from the "typedoc-plugin-rename-defaults" dependency due to a breaking change introduced in a patch version.  See [felipecrs/typedoc-plugin-rename-defaults#9](https://github.com/felipecrs/typedoc-plugin-rename-defaults/issues/9). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/21475a08ed5a308f5d8a67476a00729724b21530))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.2.0): v39.1.0 => v39.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.2.0): v39.1.0 => v39.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.2.0): v39.1.0 => v39.2.0
</details>


## [39.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.0.0...v39.1.0) (2023-09-26)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `updateVersions` and `updateDependencies` tasks accept a new option called `packagesDirectoryFilter`. It is a callback allowing filtering out directories/packages that the task should not touch. It receives an absolute path to a `package.json` and should return a boolean value. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6d5b4fc5c2ac92b0b830a642e499c1ea814aadf6))

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The changelog generator will process a squash merge commit correctly. Before the change, the tool created an additional commit that didn't match a commit pattern. Hence, it's breaking changes notes were ignored. Closes [ckeditor/ckeditor5#15056](https://github.com/ckeditor/ckeditor5/issues/15056). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a84b269acc1289a5842e2706de851ef411f0cfbe))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The "publishPackages()" task passes the "cwd" option to the release utils when executing the release script from other directory than current working directory. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d0e32b343c5d2570fc61c6107374f093a8f67603))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: UI in manual tests will now be fully translated in cases in which some translations come from external packages. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/eeb7da8a6c83b7265def003c125ddd9e32aae535))
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Fixed `typedoc-plugin-event-inheritance-fixer` plugin to not crash when creating inherited events if an interface extends a type. Closes [ckeditor/ckeditor5#15063](https://github.com/ckeditor/ckeditor5/issues/15063). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c7608b71a4009742d7a34e2267c756a7569ea9cf))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.1.0): v39.0.0 => v39.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.1.0): v39.0.0 => v39.1.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
