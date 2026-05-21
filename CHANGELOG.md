Changelog
=========

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


## [55.6.0-alpha.0](https://github.com/ckeditor/ckeditor5-dev/compare/v55.5.0...v55.6.0-alpha.0) (May 15, 2026)

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

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.6.0-alpha.0): v55.5.0 => v55.6.0-alpha.0
</details>


## [55.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/v55.4.0...v55.5.0) (April 9, 2026)

### Features

* **[changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)**: Added a generated `--help` screen to `ckeditor5-dev-changelog-create-entry` and switched its option parsing to `cac` so the CLI help stays in sync with the supported options.

### Bug fixes

* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: Detect valid direct `Locale#t` calls such as `editor.locale.t()`, `editor.t()`, `locale.t()`, and `this.t()` during translation validation and synchronization. Closes [ckeditor/ckeditor5#19267](https://github.com/ckeditor/ckeditor5/issues/19267).

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs), [typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Replaced the `typeDocExperimentalTagFixer()` plugin (introduced in v55.4.0) with TypeDoc's built-in `cascadedModifierTags` option to prevent the `@experimental` modifier tag from cascading to class members that do not explicitly declare it. Closes [ckeditor/ckeditor5#20039](https://github.com/ckeditor/ckeditor5/issues/20039).

  Previously, a custom plugin was used to remove the cascaded `@experimental` modifier after TypeDoc's conversion. TypeDoc's `cascadedModifierTags` option natively controls which modifier tags are cascaded, so removing `@experimental` from that list is a simpler and more reliable solution.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.5.0): v55.4.0 => v55.5.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.5.0): v55.4.0 => v55.5.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.5.0): v55.4.0 => v55.5.0
</details>


## [55.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v55.3.1...v55.4.0) (April 3, 2026)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The manual test server now automatically finds a free port at startup. When the preferred port (default 8125) is already in use, the server tries subsequent ports until an available one is found. The `--port` option can be used to set the starting port.
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Added the `typeDocExperimentalTagFixer` TypeDoc plugin that prevents the `@experimental` modifier tag from being cascaded to class members that do not explicitly document experimental behavior.

  Previously, when a class had `@experimental`, TypeDoc propagated the modifier to all its children (constructors, methods, properties, and synthetic observable events), causing them to appear experimental in the output even when they were not. The new plugin removes the `@experimental` modifier from any member that lacks an explicit `@xperimental` annotation in its JSDoc summary.

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs), [typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Preserved `@experimental` modifier tags in TypeDoc JSON output, including synthetic events generated from `@observable` annotations.

  This allows downstream documentation tools to recognize experimental API items and display dedicated badges.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/55.4.0): v55.3.1 => v55.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/55.4.0): v55.3.1 => v55.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/55.4.0): v55.3.1 => v55.4.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
