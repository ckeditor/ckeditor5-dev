Changelog
=========

## [50.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v49.0.2...v50.0.0) (2025-06-09)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* Updated the required version of Node.js to 22.

### Features

* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Added the `checkVersionMatch()` function, which verifies if all the dependency versions defined in `package.json` are consistent across the entire repository. Closes [ckeditor/ckeditor5#18579](https://github.com/ckeditor/ckeditor5/issues/18579). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/55ed171024c42819187d1650cbcadd33aabe9f1f))

### Other changes

* The repository now uses ESLint v9. Therefore, the required Node.js version has been upgraded to 22 to match the ESLint requirements. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/93bdfb37f520c3387d93365e3a4433b5f74fbc01))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/50.0.0): v49.0.2 => v50.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/50.0.0): v49.0.2 => v50.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/50.0.0): v49.0.2 => v50.0.0
</details>


## [49.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/v49.0.1...v49.0.2) (2025-05-19)

### Bug fixes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Fixed rendering values of the `@default` tag in API docs. Previously, TypeDoc tried to guess whether the `@default` tag value should be treated as a code, which produced invalid outputs in some cases. Now it just takes the value from this tag and renders it as inline code. Closes [ckeditor/ckeditor5#18526](https://github.com/ckeditor/ckeditor5/issues/18526). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c95b47db5d533e7005c563a095e676bada2dbab2))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/49.0.2): v49.0.1 => v49.0.2
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/49.0.2): v49.0.1 => v49.0.2
</details>


## [49.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v49.0.0...v49.0.1) (2025-05-14)

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Fixed `commitAndTag()` throwing an `ENAMETOOLONG` error when trying to commit a large number of files on Windows. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/31b44c4756eed390710809d6d133b6cab90ff5a2))

### Other changes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Ignore the requests related to the "if-cdn.com" service. Closes [ckeditor/ckeditor5#18519](https://github.com/ckeditor/ckeditor5/issues/18519). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/fef9e101c3a95e14fa48b8afa909e99b120e1e8b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/49.0.1): v49.0.0 => v49.0.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/49.0.1): v49.0.0 => v49.0.1
</details>


## [49.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v48.0.0...v49.0.0) (2025-05-05)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: The API docs builder requires `typedoc` in version 0.28 or higher.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The manual tests script will now load a default predefined identity file, if it exists.
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: The TypeDoc plugins require the `typedoc` dependency in a version `0.28` or higher.
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: CKEditor 5 events are stored in the `#ckeditor5Events` property on a class or interface declaration.
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: CKEditor 5 errors can be recognized by the `#isCKEditor5Error` flag on a declaration.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: The `strict` option passed as a modifier to the `build()` function should be wrapped into the `validatorOptions` object.
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Parameters of CKEditor 5 events and errors are now stored in the `#parameters` property (instead of `#typeParameters`).

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Migrate from `lodash-es` to `es-toolkit`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/49482f89b56806742614e6e00b18a6396785603f))
* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Treat paths used in `import.meta.resolve` as potential dependencies. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b679fdf91e61905ff4d4362e28e666c9f73d1812))
* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Improve performance. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b679fdf91e61905ff4d4362e28e666c9f73d1812))
* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Support for `typedoc@0.28`. The package uses the latest (`0.28.4`) TypeDoc release when introducing this change. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f2a4737c18c9f665b5a232b01fb07832ee624632))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Migrate from `lodash-es` to `es-toolkit`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/49482f89b56806742614e6e00b18a6396785603f))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The manual tests script will now load a default predefined identity file, if it exists. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6cc2895e4a9fdbbbaf8ccc7027ba714ea897d62a))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Migrate from `lodash-es` to `es-toolkit`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/49482f89b56806742614e6e00b18a6396785603f))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Block requests from `IGNORED_HOSTS`. ([#1117](https://github.com/ckeditor/ckeditor5-dev/issues/1117)). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/2a2a3b4d5b65c8e17cb8f3375ac2a4f26f123587))
* Update most outdated dependencies. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/49482f89b56806742614e6e00b18a6396785603f))

### Other changes

* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Introduced the `validate()` function that checks if the converted documentation is error-free. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f2a4737c18c9f665b5a232b01fb07832ee624632))

  The following cases are verified:

  * An event in the `@fires` tag exists.
  * An identifier in the `@link` tag points to an existing doclet.
  * A module name matches the path to the file where the module is defined.
  * Overloaded methods and functions are described with the mandatory and unique `@label` tag.
  * An identifier in the `@see` tag points to an existing doclet.
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Improved processing parameters of the CKEditor 5 error definitions. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f2a4737c18c9f665b5a232b01fb07832ee624632))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/49.0.0): v48.0.0 => v49.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/49.0.0): v48.0.0 => v49.0.0
</details>


## [48.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v47.1.1...v48.0.0) (2025-04-22)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Bump `puppeteer` to `^24.0.0`.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Renamed the `noSpinner` option to `silent`.

### Features

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Improved performance, allowing the time needed to process the entire CKEditor 5 documentation to be reduced by about 90% (from 50 min to 5). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c98845a3f34364632d2d70d1828d945b6c7c0341))

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Fixed the `push()` task having erroneously escaped tag. Closes [ckeditor/ckeditor5#18354](https://github.com/ckeditor/ckeditor5/issues/18354). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/be77674b3d90ad04eaa76d2992a6c5cba64f1f50))

### Other changes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Support for jobs with the "skipped" status. Closes [ckeditor/ckeditor5#18359](https://github.com/ckeditor/ckeditor5/issues/18359). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/06188327b07a9ee209089725bd9c0fcbd268b73b))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Update the `puppeteer` package to the latest version. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/25ba28ef210b24351d2712c783315a2b8c939d1d))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Ignore errors from a predefined list of external hosts used in CKEditor 5 documentation and manual tests. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/25ba28ef210b24351d2712c783315a2b8c939d1d))
* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: The package sources are now written in TypeScript. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/25ba28ef210b24351d2712c783315a2b8c939d1d))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/48.0.0): v47.1.1 => v48.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/48.0.0): v47.1.1 => v48.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/48.0.0): v47.1.1 => v48.0.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
