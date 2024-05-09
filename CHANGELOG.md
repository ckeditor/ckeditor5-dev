Changelog
=========

## [40.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.9.1...v40.0.0) (2024-05-09)

This release brings the updated configuration for the build tools. As it might produce output that is incompatible with the previous settings, this release is marked as a major bump.

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Set `target:es2022` and `loose:false` in the `swc` plugin to avoid syntax lowering and unnecessary code transformation. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/66c6a4d77ceccac04f9a435e6e679de71ed1ad33))
* **[dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dev-utils)**: Set `target: es2022` in `esbuild-loader`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/cd7ea352a90a389c6720c91944971418c8f9c627))

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Prevent TypeScript plugin from processing the source code (which is already done by the swc plugin). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/66c6a4d77ceccac04f9a435e6e679de71ed1ad33))

### Other changes

* **[dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dev-utils)**: Update `esbuild-loader` to `^4.1.0`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/cd7ea352a90a389c6720c91944971418c8f9c627))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/40.0.0): v39.9.1 => v40.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/40.0.0): v39.9.1 => v40.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/40.0.0): v39.9.1 => v40.0.0
</details>


## [39.9.1](https://github.com/ckeditor/ckeditor5-dev/compare/v39.8.0...v39.9.1) (2024-05-09)

This release aims to revert the previous one ([`v39.0.0`](https://github.com/ckeditor/ckeditor5-dev/releases/tag/v39.9.0)) that was published as a new minor instead of a major.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.9.1): v39.8.0 => v39.9.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.9.1): v39.8.0 => v39.9.1
</details>


## [39.9.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.8.0...v39.9.0) (2024-05-09)

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Set `target:es2022` and `loose:false` in the `swc` plugin to avoid syntax lowering and unnecessary code transformation. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/66c6a4d77ceccac04f9a435e6e679de71ed1ad33))
* **[dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dev-utils)**: Set `target: es2022` in `esbuild-loader`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/cd7ea352a90a389c6720c91944971418c8f9c627))

### Bug fixes

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Prevent TypeScript plugin from processing the source code (which is already done by the swc plugin). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/66c6a4d77ceccac04f9a435e6e679de71ed1ad33))

### Other changes

* **[dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dev-utils)**: Update `esbuild-loader` to `^4.1.0`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/cd7ea352a90a389c6720c91944971418c8f9c627))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.9.0): v39.8.0 => v39.9.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.9.0): v39.8.0 => v39.9.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.9.0): v39.8.0 => v39.9.0
</details>


## [39.8.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.7.0...v39.8.0) (2024-04-24)

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: Update translations plugin to also output UMD build. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/9509c2b3645faa67dda4e48a91181c45632b739c))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/39.8.0): v39.7.0 => v39.8.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.8.0): v39.7.0 => v39.8.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.8.0): v39.7.0 => v39.8.0
</details>


## [39.7.0](https://github.com/ckeditor/ckeditor5-dev/compare/v39.6.3...v39.7.0) (2024-04-23)

### Features

* **[build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools)**: First stable release of the `@ckeditor/ckeditor5-dev-build-tools` package for building packages for new installation methods. See [ckeditor/ckeditor5#15502](https://github.com/ckeditor/ckeditor5/issues/15502). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/036f52b6c55df2dda9f7c9982e98e2cc58b1d002))
* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Take exports into account when checking for missing or unused dependencies and dev dependencies. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/036f52b6c55df2dda9f7c9982e98e2cc58b1d002))

### Bug fixes

* **[dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker)**: Ignore the `dist/` directory in the dependency checker. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/036f52b6c55df2dda9f7c9982e98e2cc58b1d002))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

New packages:

* [@ckeditor/ckeditor5-dev-build-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-build-tools/v/39.7.0): v39.7.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins/v/39.7.0): v39.6.3 => v39.7.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-stale-bot](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-stale-bot/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler/v/39.7.0): v39.6.3 => v39.7.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins/v/39.7.0): v39.6.3 => v39.7.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
