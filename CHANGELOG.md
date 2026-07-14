Changelog
=========

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


## [57.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v57.0.0-alpha.1...v57.0.0) (July 8, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Introduced a new manual test format. The `manualTestsPlugin()` plugin now discovers only `*.manual.html` files, which are full HTML documents that reference their scripts with an explicit `<script type="module">` tag. The `paths` option of the `manualTestsPlugin()` and `manualStaticAssetsPlugin()` plugins now takes package root globs, for example `packages/*`, and the plugins look inside the `tests/manual/` directory of each matched package. Tests are identified in the catalog by their file path relative to that directory. Sidecar Markdown instruction files are no longer supported; instructions live inside the optional `<ck-manual-header>` element rendered as the test page header. Plain `.html` files inside `tests/manual` directories are treated as static fixtures and served without processing. Every discovered test page receives an invisible bootstrap script (license key global, editor inspector, refresh prompt), while the header chrome is injected only for pages that contain the `<ck-manual-header>` element.
* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Removed the `rawHtmlPlugin()` plugin. Use the native Vite `?raw` import query instead.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Removed the `loaders` namespace (`getCoverageLoader()`, `getTypeScriptLoader()`, `getJavaScriptLoader()`, `getDebugLoader()`, `getIconsLoader()`, `getFormattedTextLoader()`, `getStylesLoader()`) together with the `ck-debug-loader` and `ck-lightningcss-loader` webpack loaders. They were only used by the removed Karma and webpack-based manual test environments. See [ckeditor/ckeditor5-internal#4595](https://github.com/ckeditor/ckeditor5-internal/issues/4595).
* Removed the `@ckeditor/ckeditor5-dev-tests` package together with its `ckeditor5-dev-tests-run-manual` binary. To serve manual tests, use the Vite-based `@ckeditor/ckeditor5-dev-manual-server` package instead.

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added the `manualStaticAssetsPlugin()` Vite plugin that serves and emits static assets used by manual tests. This logic was previously part of the `manualTestsPlugin()` plugin, which no longer handles static assets on its own.
* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added the `rawSvgPlugin()` Vite plugin that loads `.svg` files as raw source strings.

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The `refreshPlugin()` plugin shows the "refresh available" prompt again instead of reloading the page on every JavaScript change. Vite 8.1 moved the internal structures the plugin relies on, which silently disabled it.

### Other changes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Added missing team members (`michnowak`, `tomaszdurka`, `Saddage`) to the `members.json` file used by the CI notification scripts.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/57.0.0): v57.0.0-alpha.1 => v57.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/57.0.0): v57.0.0-alpha.1 => v57.0.0
</details>


## [57.0.0-alpha.1](https://github.com/ckeditor/ckeditor5-dev/compare/v57.0.0-alpha.0...v57.0.0-alpha.1) (July 8, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Introduced a new manual test format. The `manualTestsPlugin()` plugin now discovers only `*.manual.html` files, which are full HTML documents that reference their scripts with an explicit `<script type="module">` tag. The `paths` option of the `manualTestsPlugin()` and `manualStaticAssetsPlugin()` plugins now takes package root globs, for example `packages/*`, and the plugins look inside the `tests/manual/` directory of each matched package. Tests are identified in the catalog by their file path relative to that directory. Sidecar Markdown instruction files are no longer supported; instructions live inside the optional `<ck-manual-header>` element rendered as the test page header. Plain `.html` files inside `tests/manual` directories are treated as static fixtures and served without processing. Every discovered test page receives an invisible bootstrap script (license key global, editor inspector, refresh prompt), while the header chrome is injected only for pages that contain the `<ck-manual-header>` element.
* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Removed the `rawHtmlPlugin()` plugin. Use the native Vite `?raw` import query instead.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Removed the manual test server: the `ckeditor5-dev-tests-run-manual` binary and the entire webpack-based manual test compilation environment. Manual tests are now served by the Vite-based `@ckeditor/ckeditor5-dev-manual-server` package. The only remaining part of this package is the custom Vitest matchers (`toEqualMarkup()`).
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Removed the `loaders` namespace (`getTypeScriptLoader()`, `getJavaScriptLoader()`, `getDebugLoader()`, `getIconsLoader()`, `getFormattedTextLoader()`, `getStylesLoader()`) together with the `ck-debug-loader` and `ck-lightningcss-loader` webpack loaders. They were only used by the removed webpack-based test environment.

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added the `manualStaticAssetsPlugin()` Vite plugin that serves and emits static assets used by manual tests. This logic was previously part of the `manualTestsPlugin()` plugin, which no longer handles static assets on its own.
* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added the `rawSvgPlugin()` Vite plugin that loads `.svg` files as raw source strings.

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The `refreshPlugin()` plugin shows the "refresh available" prompt again instead of reloading the page on every JavaScript change. Vite 8.1 moved the internal structures the plugin relies on, which silently disabled it.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/57.0.0-alpha.1): v57.0.0-alpha.0 => v57.0.0-alpha.1
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
