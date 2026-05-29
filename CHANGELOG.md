Changelog
=========

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


## [55.6.2](https://github.com/ckeditor/ckeditor5-dev/compare/v55.6.1...v55.6.2) (May 27, 2026)

### Other changes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Remove the `--disable-gpu` flag from the web crawler configuration, which causes performance issues on macOS.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.6.2): v55.6.1 => v55.6.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.6.2): v55.6.1 => v55.6.2
</details>


## [55.6.1](https://github.com/ckeditor/ckeditor5-dev/compare/v55.6.0...v55.6.1) (May 21, 2026)

### Bug fixes

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Fixed the suggested pre-release version when starting a pre-release cycle from a stable version. The default now reflects the underlying change type — a major bump only when breaking changes are present, a minor bump for features, and a patch bump otherwise — instead of always defaulting to a major bump.

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Removed unused `mocha` dependency in `ckeditor5-dev-utils`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.6.1): v55.6.0 => v55.6.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.6.1): v55.6.0 => v55.6.1
</details>


## [55.6.0](https://github.com/ckeditor/ckeditor5-dev/compare/v55.5.0...v55.6.0) (May 15, 2026)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: `ckeditor5-dev-tests-run-automated` and `ckeditor5-dev-tests-run-manual` will now point the user to the `--help` argument when an unknown argument is parsed, then exit process with code 1.

### Bug fixes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Fixed `ckeditor5-dev-ci-notify-circle-status` reporting "Build time: Unavailable." in Slack notifications. The CircleCI job API was called with a pipeline number instead of a job number, so the request did not return a valid `started_at` timestamp. Closes [ckeditor/ckeditor5#20081](https://github.com/ckeditor/ckeditor5/issues/20081).
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Fixed `ckeditor5-dev-tests-run-automated` hanging in production mode when webpack warnings were treated as errors. The runner now emits generated bundles before failing the browser test run.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Fixed webpack warnings from `protobufjs` in automated and manual test runners. Test webpack configurations now handle dynamic optional `require()` calls from `@protobufjs/inquire` without reporting critical dependency warnings.

### Other changes

* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Removed the `module-validator` from `typedoc-plugins`. Its function has been superseded by `validate-module-tag` ESLint rule. See https://github.com/ckeditor/ckeditor5-linters-config/releases/tag/v14.1.0.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.6.0): v55.5.0 => v55.6.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.6.0): v55.5.0 => v55.6.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.6.0): v55.5.0 => v55.6.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
