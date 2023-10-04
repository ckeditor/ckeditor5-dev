Changelog
=========

## [39.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.0.0...v39.1.0) (2023-09-26)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `updateVersions` and `updateDependencies` tasks accept a new option called `packagesDirectoryFilter`. It is a callback allowing filtering out directories/packages that the task should not touch. It receives an absolute path to a `package.json` and should return a boolean value. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6d5b4fc5c2ac92b0b830a642e499c1ea814aadf6))

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The changelog generator will process a squash merge commit correctly. Before the change, the tool created an additional commit that didn't match a commit pattern. Hence, it's breaking changes notes were ignored. Closes [ckeditor/ckeditor5#15056](https://github.com/ckeditor/ckeditor5/issues/15056). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a84b269acc1289a5842e2706de851ef411f0cfbe))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The "publishPackages()" task passes the "cwd" option to the release utils when executing the release script from other directory than current working directory. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d0e32b343c5d2570fc61c6107374f093a8f67603))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: UI in manual tests will now be fully translated in cases in which some translations come from external packages. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/eeb7da8a6c83b7265def003c125ddd9e32aae535))
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Fixed `typedoc-plugin-event-inheritance-fixer` plugin to not crash when creating inherited events if an interface extends a type. Closes [ckeditor/ckeditor5#15063](https://github.com/ckeditor/ckeditor5/issues/15063). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c7608b71a4009742d7a34e2267c756a7569ea9cf))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.1.0): v39.0.0 => v39.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.1.0): v39.0.0 => v39.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.1.0): v39.0.0 => v39.1.0
</details>


## [39.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v38.4.1...v39.0.0) (2023-09-15)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* Upgraded the minimal versions of Node.js to `18.0.0` due to the end of LTS of Node 16.

### Other changes

* Updated the required version of Node.js to 18. See [ckeditor/ckeditor5#14924](https://github.com/ckeditor/ckeditor5/issues/14924). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/61c03cd5ed3c6e0b058eb9cf17dd2b2d5958a7d0))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.0.0): v38.4.1 => v39.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.0.0): v38.4.1 => v39.0.0
</details>


## [38.4.1](https://github.com/ckeditor/ckeditor5-dev/compare/v38.4.0...v38.4.1) (2023-08-31)

### Other changes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: The `formatMessage()` function should find a Slack account based on a GitHub name case-insensitive. Closes [ckeditor/ckeditor5#14876](https://github.com/ckeditor/ckeditor5/issues/14876). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/5596b463aeeacbba49cb2910ed34ac709f5c7473))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/38.4.1): v38.4.0 => v38.4.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/38.4.1): v38.4.0 => v38.4.1
</details>


## [38.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v38.3.1...v38.4.0) (2023-08-18)

### Features

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Introduced the `ckeditor5-dev-ci-allocate-swap-memory` binary script for allocating the SWAP memory to avoid issues with running out of RAM. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d4cff5e2fbcaf219b91414da2c98ab917f9e12b9))
* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Introduced the `ckeditor5-dev-ci-install-latest-chrome` binary script for installing the latest Chrome browser. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d4cff5e2fbcaf219b91414da2c98ab917f9e12b9))

### Other changes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Notifiers will not ping the entire channel in case a login of a committer cannot be obtained, but its GitHub name is included in the bots-users array. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/10edd909128330d6f0705407ae008c4239ff1b31))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `reassignNpmTags()` task processes all packages asynchronously to improve the performance results. Closes [ckeditor/ckeditor5#14769](https://github.com/ckeditor/ckeditor5/issues/14769). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/baf3340a322f6560f46e2cdbb9d328c5827404e3))
* **[translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)**: The generated `*.po` files will include the "Content-Type" header with the charset set as `UTF-8` to avoid issues while processing non-ASCII characters across systems. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b0fe2a54572b4f5bfbe9f3fc65c4dfee477b467f))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/38.4.0): v38.3.1 => v38.4.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/38.4.0): v38.3.1 => v38.4.0
</details>


## [38.3.1](https://github.com/ckeditor/ckeditor5-dev/compare/v38.3.0...v38.3.1) (2023-08-10)

Internal changes only (updated dependencies, documentation, etc.).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/38.3.1): v38.3.0 => v38.3.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/38.3.1): v38.3.0 => v38.3.1
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
