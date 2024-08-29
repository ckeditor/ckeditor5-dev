Changelog
=========

## [42.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v42.0.1...v42.1.0) (2024-08-29)

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Introduced a new `loadSourcemaps` plugin for loading source maps of external dependencies. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/defb966ca3e090d062d173e5098a2325696491ec))

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Fixed source maps generation for the UMD build. Fixes [ckeditor/ckeditor5#16984](https://github.com/ckeditor/ckeditor5/issues/16984). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/defb966ca3e090d062d173e5098a2325696491ec))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/42.1.0): v42.0.1 => v42.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/42.1.0): v42.0.1 => v42.1.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/42.1.0): v42.0.1 => v42.1.0
</details>


## [42.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v42.0.0...v42.0.1) (2024-08-13)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added a Chrome flag to prevent displaying the search engine choice screen that disrupts automated tests in windowed mode. Closes [ckeditor/ckeditor5#16825](https://github.com/ckeditor/ckeditor5/issues/16825). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4f7291f1f8114ed0184f11a51c74752c6d8ecaa9))

### Other changes

* **[stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot)**: Aligned stale bot to recent changes in the GitHub GraphQL API in the `repository.labels` connection. GitHub recently started returning a lot of mismatched labels for the query and now stale bot ensures that only the required ones are used. Closes [ckeditor/ckeditor5#16872](https://github.com/ckeditor/ckeditor5/issues/16872). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/666daf6cfe52b5ce63e7937168022eb86fcb4f9c))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/42.0.1): v42.0.0 => v42.0.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/42.0.1): v42.0.0 => v42.0.1
</details>


## [42.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v41.0.0...v42.0.0) (2024-07-29)

We are excited to announce a new major release of the `@ckeditor/ckeditor5-dev-*` packages.

### Release highlights

This release brings the updated configuration for the build tools. As it might produce output incompatible with the previous settings, this release is marked as a major bump.

The [`@ckeditor/ckeditor5-dev-build-tools`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools) package now supports a new `globals` option, which allows passing pairs of external package names and associated global variables used in the `umd` build.

Additionally, the global names for the `ckeditor5` and `ckeditor5-premium-features` packages in the UMD builds have been changed to `CKEDITOR` and `CKEDITOR_PREMIUM_FEATURES` respectively.

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: The global names for the `ckeditor5` and `ckeditor5-premium-features` packages in the UMD builds have been changed to `CKEDITOR` and `CKEDITOR_PREMIUM_FEATURES` respectively.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Ability to pass `globals` parameter if necessary for external imports in `umd` bundles.

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Ability to pass `globals` parameter if necessary for external imports in `umd` bundles. See https://github.com/ckeditor/ckeditor5/issues/16798. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/74f4571f186a2cbb30a8d3fcb62475c89f59c641))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/42.0.0): v41.0.0 => v42.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/42.0.0): v41.0.0 => v42.0.0
</details>


## [41.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v40.5.0...v41.0.0) (2024-07-22)

We are excited to announce a new major release of the `@ckeditor/ckeditor5-dev-*` packages.

### Release highlights

This release introduces changes to the [`@ckeditor/ckeditor5-dev-build-tools`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools) and [`@ckeditor/ckeditor5-dev-dependency-checker`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker) packages, resulting in different output than in the previous release.

The [`@ckeditor/ckeditor5-dev-build-tools`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools) package now outputs the bundle types in the `dist` folder with the rest of the bundled files instead of `dist/types.` It ensures a proper location of types when the `/dist/index.js` file is imported. If you use this package in your project and upgrade to the latest version, update the `package.json` file to reflect the new location of the type files.

The [`@ckeditor/ckeditor5-dev-dependency-checker`](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker) package will now treat dependencies used in the `dist` folder as production `dependencies` instead of `devDependencies.` It ensures a proper declaration of dependencies used by the new installation methods of CKEditor 5 in the `package.json` file.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Treat dependencies in the `dist` folder as production `dependencies`.
* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Output types in `dist` instead of `dist/types`.

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Should preserved all needed selectors and at-rules in CSS files after split into editor and content stylesheets. Closes https://github.com/ckeditor/ckeditor5/issues/16703. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/2b0feb396685156b495407205bf95acef1ae6ffa))
* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Output typings in the same folder as the bundles. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/06a95619ecf1e6c7f1148eae15835592cdeefaa2))
* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Treat dependencies in the `dist` folder as production dependencies. See [ckeditor/ckeditor5#16646](https://github.com/ckeditor/ckeditor5/issues/16646). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/09d304f39c62edf3399069456aa5a9e345f082bb))
* **[dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dev-ci)**: Improved error handling by checking both error properties for the `triggerCircleBuild()` util. Closes [ckeditor/ckeditor5#16746](https://github.com/ckeditor/ckeditor5/issues/16746). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/9af7fb7eccb4e633a8857a3d05089b524ab8e066))

### Other changes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: The `.d.ts` files for translations should import directly from `@ckeditor/ckeditor5-utils` instead of `ckeditor5`. See [ckeditor/ckeditor5#16646](https://github.com/ckeditor/ckeditor5/issues/16646). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/09d304f39c62edf3399069456aa5a9e345f082bb))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/41.0.0): v40.5.0 => v41.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/41.0.0): v40.5.0 => v41.0.0
</details>


## [40.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/v40.4.0...v40.5.0) (2024-07-16)

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Create a util for extracting an npm tag from the specified version. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/784ab36187b5eaddd2bc53135bf58df664870b47))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Add util to check if a given package and its version are available on npm. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/784ab36187b5eaddd2bc53135bf58df664870b47))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/40.5.0): v40.4.0 => v40.5.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/40.5.0): v40.4.0 => v40.5.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/40.5.0): v40.4.0 => v40.5.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
