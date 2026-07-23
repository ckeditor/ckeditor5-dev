Changelog
=========

## [58.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v57.4.0...v58.0.0) (July 22, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Replaced the `splitCss` plugin with the reworked `bundleCss` plugin. CSS must now be imported through explicit `theme/index-editor.css` and `theme/index-content.css` entry points, and builds emit separate editor and content stylesheets next to the combined CSS bundle. The combined bundle preserves the JavaScript import order, keeping the editor and content styles of each feature next to each other.

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Fixed the manual test server to reload only affected pages after HTML or CSS changes.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/58.0.0): v57.4.0 => v58.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/58.0.0): v57.4.0 => v58.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/58.0.0): v57.4.0 => v58.0.0
</details>


## [57.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v57.3.0...v57.4.0) (July 16, 2026)

### Features

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Exported the `formatMessage()` helper from the package index. It builds the Slack notification payload for a failed CI build and can now be used by other tools, not only by the `ckeditor5-dev-ci-notify-circle-status` command.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/57.4.0): v57.3.0 => v57.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/57.4.0): v57.3.0 => v57.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/57.4.0): v57.3.0 => v57.4.0
</details>


## [57.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v57.2.0...v57.3.0) (July 14, 2026)

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The `manualTestsPlugin()` plugin now loads the package theme entry stylesheet (`theme/index.css`) in manual tests. Package stylesheets are imported by the package entry module (`src/index.ts`), not by individual source modules, so manual tests that import source modules directly would otherwise render without the package's own styles. The import is appended to the entry script of every discovered manual page whose package has a theme entry stylesheet, preserving the cascade order of the built bundles. See [ckeditor/ckeditor5#17102](https://github.com/ckeditor/ckeditor5/issues/17102).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/57.3.0): v57.2.0 => v57.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/57.3.0): v57.2.0 => v57.3.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/57.3.0): v57.2.0 => v57.3.0
</details>


## [57.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v57.1.0...v57.2.0) (July 13, 2026)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Introduced the `useOidc` option in the `publishPackages()` task to support npm Trusted Publishing. When enabled, the task no longer verifies the npm account with `npm whoami` and the `npmOwner` option is not required. Instead, the task verifies that the `NPM_ID_TOKEN` environment variable is set, as npm exchanges the OIDC token only during supported operations, such as `npm publish`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/57.2.0): v57.1.0 => v57.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/57.2.0): v57.1.0 => v57.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/57.2.0): v57.1.0 => v57.2.0
</details>


## [57.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v57.0.0...v57.1.0) (July 13, 2026)

### Features

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Added support for triggering a specific CircleCI GitHub App pipeline definition using the `--pipeline-definition-id` option of the `ckeditor5-dev-ci-trigger-circle-build` command.

### Other changes

* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Removed the `CKEditorTranslationsPlugin` webpack plugin and the `MultipleLanguageTranslationService` class from the `@ckeditor/ckeditor5-dev-translations` package. Closes [ckeditor/ckeditor5#20205](https://github.com/ckeditor/ckeditor5/issues/20205).

  The plugin served only the legacy webpack-based installation methods, which were replaced by the new installation methods introduced in CKEditor 5 v42.0.0. No CKEditor 5 tooling uses it anymore, so it is removed as dead code. The `findMessages()`, `synchronizeTranslations()`, and `moveTranslations()` functions remain available.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/57.1.0): v57.0.0 => v57.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/57.1.0): v57.0.0 => v57.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/57.1.0): v57.0.0 => v57.1.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
