Changelog
=========

## [61.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v61.0.0...v61.1.0) (August 21, 2026)

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added a Vite plugin that preserves CSS import order in production builds.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The GitHub token used by the release workflow is now verified against the target repository instead of being required to contain 40 characters.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `updateDependencies()` release helper now allows excluding the package in the working directory.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/61.1.0): v61.0.0 => v61.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/61.1.0): v61.0.0 => v61.1.0
</details>


## [61.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v60.0.0...v61.0.0) (August 19, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The deprecated `findPathsToPackages()` and `checkVersionAvailability()` functions are no longer exported. Use the `workspaces` and `npm` namespaces from `@ckeditor/ckeditor5-dev-utils` instead.
* Removed the `@ckeditor/ckeditor5-dev-dependency-checker` package. It was built on top of the deprecated `depcheck` library. Use [`knip`](https://knip.dev/) to validate dependencies instead.

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server now preserves CSS import order when bundled dev splits styles across chunks.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/61.0.0): v60.0.0 => v61.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/61.0.0): v60.0.0 => v61.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/61.0.0): v60.0.0 => v61.0.0
</details>


## [60.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v59.1.0...v60.0.0) (August 17, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Replaced PO translation file support with generated TypeScript translation modules. The build tools now collect TypeScript translation sources from `**/lang/translations/*.ts` by default and load them through native `import()`. Each module must default-export translations keyed by the language code matching its filename, for example `en.ts` must export an `en` key.

  Dictionary-only sources no longer emit a `getPluralForm` property (or `"getPluralForm": null`) in ESM output, and a dictionary-only UMD source does not overwrite an already registered plural function.
* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Replaced PO translation file support with generated TypeScript translation modules. The translation management utilities now read, create, synchronize, and move TypeScript translation sources.

  The `synchronizeTranslations()` and `moveTranslations()` functions are now asynchronous and must be awaited. The new `readTranslationFile()` function is asynchronous and must be awaited, while `serializeTranslationFile()` serializes a translation dictionary synchronously.

  The `synchronizeTranslations()` function now accepts `translationsTypeImportSource` to select the package from which generated files import the `Translations` type. It defaults to `@ckeditor/ckeditor5-utils`.

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added support for loading TypeScript translation sources and selecting the default editor language in the Vite manual test server.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/60.0.0): v59.1.0 => v60.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/60.0.0): v59.1.0 => v60.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/60.0.0): v59.1.0 => v60.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/60.0.0): v59.1.0 => v60.0.0
</details>


## [59.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v59.0.0...v59.1.0) (August 13, 2026)

### Features

* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Added the `typedoc-plugin-hierarchy-fixer` plugin that restores the class hierarchy in the generated API documentation data for classes extending an intermediate mixin constant, for example `const ClassicEditorBase = ElementApiMixin( Editor )`. The plugin replaces the unresolvable base class reference with the actual base class, restores the "Subclasses" relation on the base class page, and lists the mixin interfaces in the "Implements" section. It also prevents references to reflections removed by the private API purge mechanism from leaking into the documentation output.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/59.1.0): v59.0.0 => v59.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/59.1.0): v59.0.0 => v59.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/59.1.0): v59.0.0 => v59.1.0
</details>


## [59.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v58.0.0...v59.0.0) (July 30, 2026)

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Manual tests are now discovered in the root-level `manual/` directory of a package instead of `tests/manual/`.

  The `manualStaticAssetsPlugin()` plugin has been removed. Use the built-in `publicDir` option of Vite to serve static assets instead.

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Improved the manual test runner UI to make tests faster and easier to find.

  It is now possible to save frequently used tests as favorites. Search results show the best matching packages first. Matching package and test names are highlighted. The clear button now looks the same across browsers.

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Manual tests now load the package theme stylesheets from `theme/index-editor.css` and `theme/index-content.css` instead of the removed `theme/index.css`, restoring package styles on manual test pages.

  The manual test header no longer covers sticky toolbars, menu bars, and balloons when the page is scrolled. The header bar now stays in the normal document flow instead of being fixed to the viewport.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Minor releases (contain minor breaking changes):

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/59.0.0): v58.0.0 => v59.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/59.0.0): v58.0.0 => v59.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/59.0.0): v58.0.0 => v59.0.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
