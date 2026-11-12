Changelog
=========

## [63.1.4](https://github.com/ckeditor/ckeditor5-dev/compare/v63.1.3...v63.1.4) (November 12, 2026)

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server starts and rebuilds on Linux again. With Rolldown 1.2.13 or newer, the bundled development server watched the whole workspace, because the module that loads translations used one glob import for all package directories. On Linux, the server then tried to register every directory, including the `node_modules` directories that link to each other in a pnpm workspace. It did not finish, so the server never became ready.

  The translation files are now imported one by one, and the `node_modules` and `.git` directories are excluded from the watcher. A translation file added while the server is running is loaded after a server restart.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/63.1.4): v63.1.3 => v63.1.4
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/63.1.4): v63.1.3 => v63.1.4
</details>


## [63.1.3](https://github.com/ckeditor/ckeditor5-dev/compare/v63.1.2...v63.1.3) (November 9, 2026)

### Other changes

* **[agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents)**: Upgraded Pi (`@earendil-works/pi-ai` and `@earendil-works/pi-coding-agent`) to v1.5.0.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/63.1.3): v63.1.2 => v63.1.3
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/63.1.3): v63.1.2 => v63.1.3
</details>


## [63.1.2](https://github.com/ckeditor/ckeditor5-dev/compare/v63.1.1...v63.1.2) (November 6, 2026)

### Bug fixes

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server now picks up edits to inline `<style>` elements in manual test HTML files. Before, the bundled development server kept serving the inline styles from the moment it started while the rest of the page updated, so a correct CSS change could look broken until the server was restarted. Inline module scripts and `style` attributes that Vite processes are refreshed the same way.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `reassignNpmTags()` and `removeNpmTags()` tasks now work on Windows. Before, they put the values passed to npm, such as package names and versions, in single quotes, which only POSIX shells remove. On Windows, npm got the quotes as a part of the values: it could not find scoped packages, and `removeNpmTags()` reported unscoped packages as skipped while their tag stayed in place.

  The tasks now pass the values to npm without quotes and validate them first. They throw an error before running npm when a package name or the npm tag contains characters other than letters, digits, `.`, `_`, and `-` (a package name may also have a scope), or when the version is not valid.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/63.1.2): v63.1.1 => v63.1.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/63.1.2): v63.1.1 => v63.1.2
</details>


## [63.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v63.1.0...v63.1.1) (November 2, 2026)

### Other changes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Upgraded `puppeteer` to v25.
* Upgraded `glob` to v14. On Windows, `ignore` patterns that start with `/` now start at the root of the drive, the same as other patterns that start with `/`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/63.1.1): v63.1.0 => v63.1.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/63.1.1): v63.1.0 => v63.1.1
</details>


## [63.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v63.0.0...v63.1.0) (October 28, 2026)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: `publishPackages()` accepts the `staging-v{version}` npm tag for a stable release when `{version}` is the exact package version, for example `staging-v1.2.3` for v1.2.3. It lets several release lines stage their packages at the same time without moving one shared `staging` tag.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Added the `removeNpmTags()` function. It removes an npm dist-tag from all given packages, for example, a temporary tag used to stage a release. It works like `reassignNpmTags()`: it supports npm Trusted Publishing (OIDC), retries failed packages, and rejects after all packages have been processed when any of them failed. Packages that do not have the tag are reported as skipped, so it can be run again after a partial failure.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: `getVersionForTag()` no longer returns `null` when the npm registry cannot answer, for example, when it cannot be reached. It returns `null` only when the registry says that the tag or the package does not exist, and it rethrows any other error. Before, a network error looked like a missing tag. Then `isLatestOrNextStableVersion()` treated any version as the newest one, so a script could move the `latest` tag to an older release line.
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: `npm.checkVersionAvailability()` no longer reports a version as available when the npm registry cannot answer, for example, when it cannot be reached. It resolves to `true` only when the registry says that the version or the package does not exist, and it rethrows any other error. Before, a network error made an already published version look available. `publishPackages()` and the changelog version prompt use this check, so they now fail with the network error instead of continuing.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/63.1.0): v63.0.0 => v63.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/63.1.0): v63.0.0 => v63.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/63.1.0): v63.0.0 => v63.1.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
