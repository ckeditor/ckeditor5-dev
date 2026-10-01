Changelog
=========

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


## [62.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v61.2.0...v62.0.0) (September 9, 2026)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: The `bundleCss()` plugin no longer flattens CSS nesting. Bundled stylesheets now ship native `&` nesting for the browser to resolve.

  Lightning CSS was previously configured to always compile nesting away, regardless of targets. Nesting is now Baseline widely available, so the output keeps it. Integrators post-processing the bundled CSS with tooling that predates native nesting may need to add a nesting transform.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/62.0.0): v61.2.0 => v62.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/62.0.0): v61.2.0 => v62.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/62.0.0): v61.2.0 => v62.0.0
</details>


## [61.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v61.1.0...v61.2.0) (September 4, 2026)

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server now reloads complete HTML documents after edits, including changes made inside `<head>`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/61.2.0): v61.1.0 => v61.2.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/61.2.0): v61.1.0 => v61.2.0
</details>


## [61.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v61.0.0...v61.1.0) (August 21, 2026)

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Added a Vite plugin that preserves CSS import order in production builds.

### Bug fixes

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

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
