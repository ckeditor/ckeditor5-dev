Changelog
=========

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


## [57.0.0-alpha.0](https://github.com/ckeditor/ckeditor5-dev/compare/v56.6.0...v57.0.0-alpha.0) (July 7, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests), [utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Removed the automated test runner: the `ckeditor5-dev-tests-run-automated` binary and the entire Karma testing environment. Automated tests are now executed directly with Vitest, using the packages' own `test` scripts. The manual test server (`ckeditor5-dev-tests-run-manual`) is unaffected. See [ckeditor/ckeditor5-internal#4595](https://github.com/ckeditor/ckeditor5-internal/issues/4595).

  Along with the Karma environment, the following were removed:

  * The IntelliJ Karma runner integration and desktop notifications support (`node-notifier`).
  * The `loaders.getCoverageLoader()` function from `@ckeditor/ckeditor5-dev-utils`.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Replaced the `equalMarkup` Chai assertion with the `toEqualMarkup()` Vitest matcher to match the Vitest naming style. Update the call sites (`expect( a ).to.equalMarkup( b )` → `expect( a ).toEqualMarkup( b )`) and register the matcher in a Vitest setup file via `expect.extend( { toEqualMarkup } )`, importing it from `@ckeditor/ckeditor5-dev-tests`. Closes [ckeditor/ckeditor5-internal#4595](https://github.com/ckeditor/ckeditor5-internal/issues/4595).

  The main entry point of the package now exposes only the custom Vitest matchers, so it can be imported in a browser context (for example, in a Vitest setup file). It no longer exports the `runAutomatedTests()`, `runManualTests()`, and `parseArguments()` functions, which were only used internally by the test runner binaries. Additionally, the unused `attribute` Chai assertion was removed.

### Other changes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Added missing team members (`michnowak`, `tomaszdurka`, `Saddage`) to the `members.json` file used by the CI notification scripts.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/57.0.0-alpha.0): v56.6.0 => v57.0.0-alpha.0
</details>


## [56.6.0](https://github.com/ckeditor/ckeditor5-dev/compare/v56.5.0...v56.6.0) (July 1, 2026)

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added the `ckDebugPlugin()` Vite plugin to the manual server package.

### Bug fixes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: The workflow notifier no longer throws when the CircleCI API returns a job without the `dependencies` property. Such a job is now treated as a job with no dependencies.
* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Resolve the `typedoc-plugin-rename-defaults` plugin to an absolute path before passing it to TypeDoc. TypeDoc resolves a bare plugin name relative to its own install location, which fails when TypeDoc is linked from outside the project tree - for example when a consumer enables pnpm's `enableGlobalVirtualStore` and TypeDoc is served from the global store.
* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Restored automatic CKEditor Inspector attachment for manual tests that expose their editor instance as `window.editor`, matching the behavior of the previous manual test server.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/56.6.0): v56.5.0 => v56.6.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/56.6.0): v56.5.0 => v56.6.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/56.6.0): v56.5.0 => v56.6.0
</details>


## [56.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/v56.4.0...v56.5.0) (June 24, 2026)

### Bug fixes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Replaced unmaintained `gray-matter` library with `@11ty/gray-matter`.

### Other changes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Update Rolldown to `v1.1.2`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/56.5.0): v56.4.0 => v56.5.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/56.5.0): v56.4.0 => v56.5.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
