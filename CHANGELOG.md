Changelog
=========

## [64.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v63.1.5...v64.0.0) (November 23, 2026)

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: The crawler now runs pages in `chrome-headless-shell` instead of the full Chrome browser, because it uses noticeably less CPU. With a default install, Puppeteer already downloads it. If you skip the download (for example, with `PUPPETEER_SKIP_DOWNLOAD`), install it with the `puppeteer browsers install chrome-headless-shell` command of the Puppeteer version that the crawler uses, or set `PUPPETEER_EXECUTABLE_PATH`. The full Chrome browser still works, but uses more CPU.

  The crawler also checks pages faster. It reuses browser pages, and after a page loads, it waits until no request has been in progress for 250 ms instead of 500 ms.

### Features

* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: The manual test server now loads CKEditor Inspector on demand. Click **Inspector** in the page header to inspect the registered editors.

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: The `translations()` plugin now produces the same translation files in every build. Before, it merged the translation files in the order in which `glob` found them, which could change between builds. So the order of the messages could differ, and when two files defined the same message, either value could be used. The files are now merged in the order of their paths.
* **[manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server)**: Editors in open and closed shadow roots now retain their styles in production builds of manual tests.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Minor releases (contain minor breaking changes):

* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/64.0.0): v63.1.5 => v64.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/64.0.0): v63.1.5 => v64.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/64.0.0): v63.1.5 => v64.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/64.0.0): v63.1.5 => v64.0.0
</details>


## [63.1.5](https://github.com/ckeditor/ckeditor5-dev/compare/v63.1.4...v63.1.5) (November 16, 2026)

### Other changes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Added `ksokolowski-cksource` to the GitHub-to-Slack members mapping used by CI notifications.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-agents](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-agents/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-changelog](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-license-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-license-checker/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-manual-server](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-manual-server/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/63.1.5): v63.1.4 => v63.1.5
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/63.1.5): v63.1.4 => v63.1.5
</details>


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

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
