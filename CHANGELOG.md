Changelog
=========

## [56.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v56.2.0...v56.2.1) (June 11, 2026)

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server no longer removes external scripts whose file names match a manual test entry script.

  This preserves CDN scripts when wrapping and serving manual tests.
* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server now serves CSS files linked from manual test HTML files.

  This preserves manual test stylesheets when wrapping and serving manual tests.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/56.2.1): v56.2.0 => v56.2.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/56.2.1): v56.2.0 => v56.2.1
</details>


## [56.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v56.1.0...v56.2.0) (June 11, 2026)

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added a new `@ckeditor/ckeditor5-dev-manual-server` package containing plugins for a new Vite-based manual test server.

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Spawn Vitest from each package's directory instead of going through the workspace `--project <name>` path.

  The workspace + browser-mode + per-file isolation combination hung the CI batch as soon as a project had more than one test file. Running per-package avoids that path.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/56.2.0): v56.1.0 => v56.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/56.2.0): v56.1.0 => v56.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/56.2.0): v56.1.0 => v56.2.0
</details>


## [56.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v56.0.0...v56.1.0) (June 2, 2026)

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Added the `stripInternal` build option and the `--strip-internal` CLI flag for controlling whether declarations marked with `@internal` are omitted from generated declaration files. The option is enabled by default.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/56.1.0): v56.0.0 => v56.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/56.1.0): v56.0.0 => v56.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/56.1.0): v56.0.0 => v56.1.0
</details>


## [56.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v55.6.3...v56.0.0) (May 29, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Removed output path rewriting from `ckeditor5-dev-build-tools` except for package imports rewritten to `ckeditor5` and `ckeditor5-premium-features` in browser builds.

  The `rewrite` JavaScript API option was removed. Imports using `ckeditor5/src/*` and `ckeditor5-collaboration/src/*` are no longer rewritten automatically.
* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Replaced Rollup with Rolldown in `ckeditor5-dev-build-tools`.

  Rollup-specific dependencies that are no longer needed because Rolldown provides equivalent features out of the box were removed.
* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Changed `ckeditor5-dev-build-tools` to assume that package sources use TypeScript isolated declarations.

  Declaration files are now generated without invoking TypeScript, so builds no longer perform type checking.
* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Removed the `loadTypeScriptSources`, `replaceImports`, and `emitCss` exports from `ckeditor5-dev-build-tools`.

  The `loadTypeScriptSources` and `replaceImports` behavior is now handled by Rolldown. The `bundleCss` plugin now ensures that a CSS file is always emitted, including when the generated file is empty.

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Added the `declarationFiles` plugin to `ckeditor5-dev-build-tools` for generating `.d.ts` files from TypeScript sources that use isolated declarations.

### Other changes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Improved the performance of selected `ckeditor5-dev-build-tools` plugins.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/56.0.0): v55.6.3 => v56.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/56.0.0): v55.6.3 => v56.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/56.0.0): v55.6.3 => v56.0.0
</details>


## [55.6.3](https://github.com/ckeditor/ckeditor5-dev/compare/v55.6.2...v55.6.3) (May 27, 2026)

### Other changes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Added `ckeditor5-dev-ci-notify-github-actions-status`, a GitHub Actions equivalent of `ckeditor5-dev-ci-notify-circle-status` that posts a Slack notification summarizing a failed workflow. See [ckeditor/ckeditor5-internal#4450](https://github.com/ckeditor/ckeditor5-internal/issues/4450).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.6.3): v55.6.2 => v55.6.3
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.6.3): v55.6.2 => v55.6.3
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
