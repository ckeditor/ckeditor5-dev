Changelog
=========

## [62.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v62.3.0...v62.4.0) (October 12, 2026)

### Features

* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents)**: Introduced the `@ckeditor/ckeditor5-dev-agents` package. It runs recurring AI agent tasks against a repository and delivers the results as a pull request. A task judges the units it defines, skips the units whose content has not changed since the last run, and can fix what it finds. A human reviews the findings and the fixes in the pull request.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

New packages:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/62.4.0): v62.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.4.0): v62.3.0 => v62.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.4.0): v62.3.0 => v62.4.0
</details>


## [62.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v62.2.1...v62.3.0) (October 2, 2026)

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Manual test pages with the `<ck-manual-header>` element now use the editor font family on `<body>` instead of the default browser font. The font is read from the `--ck-font-family` CSS custom property, and the legacy `--ck-font-face` property still takes precedence when it is overridden.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.3.0): v62.2.1 => v62.3.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.3.0): v62.2.1 => v62.3.0
</details>


## [62.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v62.2.0...v62.2.1) (October 1, 2026)

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `publishPackages()` and `reassignNpmTags()` tasks no longer fail on CircleCI when a release with npm Trusted Publishing (`useOidc`) takes longer than 5 minutes. See [ckeditor/ckeditor5-internal#4658](https://github.com/ckeditor/ckeditor5-internal/issues/4658).

  * npm accepts a CircleCI OIDC token only for 5 minutes after it was issued. Before, the remaining packages failed with `401 unauthorized`.
  * On CircleCI, the tasks now request a fresh token with the CircleCI CLI (`circleci`) right before each `npm publish` and `npm dist-tag add` call.
  * Without the CircleCI CLI, or outside CircleCI, the tasks use the `NPM_ID_TOKEN` environment variable, as before.
  * When no token can be obtained, the tasks stop before processing any package.
  * The new `getNpmIdToken()` function returns the token that the tasks use. It is exported from the package.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.2.1): v62.2.0 => v62.2.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.2.1): v62.2.0 => v62.2.1
</details>


## [62.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v62.1.0...v62.2.0) (October 1, 2026)

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Manual test pages with the `<ck-manual-header>` element now add default horizontal padding around the test content, so the editor no longer touches the edges of the browser window. The header bar still spans the full window width, and the space below it matches the side padding.

  The padding is controlled by the `--ck-page-padding` CSS custom property on `<body>`. Tests that need a full-width layout can opt out with `body { --ck-page-padding: 0; }`.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Introduced the `useOidc` option in the `reassignNpmTags()` task to support npm Trusted Publishing. When enabled, the task no longer verifies the npm account with `npm whoami` and the `npmOwner` option is not required. Instead, the task verifies that the `NPM_ID_TOKEN` environment variable is set. Changing dist-tags with OIDC requires npm 11.21.0 or newer and a trusted publisher that allows the `npm dist-tag` command.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.2.0): v62.1.0 => v62.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.2.0): v62.1.0 => v62.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.2.0): v62.1.0 => v62.2.0
</details>


## [62.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v62.0.0...v62.1.0) (September 28, 2026)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `executeInParallel()` function now stores the temporary worker module inside the project instead of in its root directory. The location is configurable via the new `workerDirectory` option, which is resolved from `cwd` and defaults to `build`. Closes [ckeditor/ckeditor5#18939](https://github.com/ckeditor/ckeditor5/issues/18939).

  The module must stay inside the project so that `import()` calls in the executed callback resolve dependencies from the project's `node_modules`. Storing it in a directory Git ignores prevents a leftover module from polluting the working tree if the process is aborted or fails.

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Manual test pages no longer request a missing `/favicon.ico`, preventing spurious 404 errors during verification.
* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Fixed missing source files and unavailable breakpoints in browser developer tools when the manual test server enables debug statements.

### Other changes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Manual test builds now group widely shared modules to reduce chunk requests and improve crawling performance. Bundled development retains automatic chunking.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.1.0): v62.0.0 => v62.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.1.0): v62.0.0 => v62.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.1.0): v62.0.0 => v62.1.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
