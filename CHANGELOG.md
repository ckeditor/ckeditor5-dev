Changelog
=========

## [31.1.9](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.8...v31.1.9) (2022-11-17)

### Bug fixes

* **[webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin)**: The `TranslateSource` loader is added as the last one in the loader's chain after any potential TypeScript file has already been compiled. Closes [ckeditor/ckeditor5#12735](https://github.com/ckeditor/ckeditor5/issues/12735). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6c972102d1576ce241c3e2aa5b785a2d37f6ea4e))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.8 => v31.1.9
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.8 => v31.1.9
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.8 => v31.1.9
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.8 => v31.1.9
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.8 => v31.1.9
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.8 => v31.1.9
</details>


## [31.1.8](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.7...v31.1.8) (2022-11-04)

The `v31.1.8` release restores changes introduced in the [`v31.1.6`](https://github.com/ckeditor/ckeditor5-dev/releases/tag/v31.1.6) version.

We found a different approach to add `DllReferencePlugin` to the webpack configuration for DLL and non-DLL manual tests. Now, they are compiled in separate processes, and the `CKEditor5 is not defined` error should not occur anymore.

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: When processing manual tests, if any of them require a DLL build, the manual test server adds the `DllReferencePlugin` plugin to the webpack configuration to avoid the duplicated modules error when using an import statement behind the `CK_DEBUG_*` flags. See [ckeditor/ckeditor5#12791](https://github.com/ckeditor/ckeditor5/issues/12791). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/01e454ec2f6251b5731abd0a88bbf63059c6516d))

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Split DLL and non-DLL manual tests to run separate webpack processes for both groups. They need to be compiled separately because DLL tests require `DllReferencePlugin`, and non-DLL ones must not have it. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/01e454ec2f6251b5731abd0a88bbf63059c6516d))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.7 => v31.1.8
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.7 => v31.1.8
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.7 => v31.1.8
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.7 => v31.1.8
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.7 => v31.1.8
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.7 => v31.1.8
</details>


## [31.1.7](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.6...v31.1.7) (2022-11-04)

### Bug fixes

* Reverts [#809](https://github.com/ckeditor/ckeditor5-dev/issues/809) due to the `CKEditor5 is not defined` error when processing mixed tests (DLL and non-DLL). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f95f7ee8ebf4e46d8aa56d6abbb615c805c05859))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.6 => v31.1.7
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.6 => v31.1.7
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.6 => v31.1.7
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.6 => v31.1.7
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.6 => v31.1.7
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.6 => v31.1.7
</details>


## [31.1.6](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.5...v31.1.6) (2022-11-04)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: When processing manual tests, if any of them require a DLL build, the manual test server adds the `DllReferencePlugin` plugin to the webpack configuration to avoid the duplicated modules error when using an import statement behind the `CK_DEBUG_*` flags. Closes [ckeditor/ckeditor5#12791](https://github.com/ckeditor/ckeditor5/issues/12791). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/044841f3e421da8e1fde201a334968bcbc037fcb))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.5 => v31.1.6
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.5 => v31.1.6
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.5 => v31.1.6
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.5 => v31.1.6
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.5 => v31.1.6
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.5 => v31.1.6
</details>


## [31.1.5](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.4...v31.1.5) (2022-10-27)

### Bug fixes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The DLL configuration should reference backward compatible `*.js` files (not `*.ts`). See [ckeditor/ckeditor5#12752](https://github.com/ckeditor/ckeditor5/issues/12752). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/3942115448bd1ca026eaf7f129ff8a13bccbf6e9))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.4 => v31.1.5
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.4 => v31.1.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.4 => v31.1.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.4 => v31.1.5
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.4 => v31.1.5
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.4 => v31.1.5
</details>


## [31.1.4](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.3...v31.1.4) (2022-10-25)

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Support for referencing DLLs built from TypeScript. Closes [ckeditor/ckeditor5#12694](https://github.com/ckeditor/ckeditor5/issues/12694). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/9688378ac7b894e70e62debb6a7ec5c39325f913))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.3 => v31.1.4
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.3 => v31.1.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.3 => v31.1.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.3 => v31.1.4
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.3 => v31.1.4
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.3 => v31.1.4
</details>


## [31.1.3](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.2...v31.1.3) (2022-10-20)

### Bug fixes

* **[webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin)**: Improved the default RegExp used in the `sourceFilesPattern` option to match only `*.ts` and `*.js` files. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/8fef05c578e7534250e6462f044adc72af24d14f))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.2 => v31.1.3
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.2 => v31.1.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.2 => v31.1.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.2 => v31.1.3
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.2 => v31.1.3
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.2 => v31.1.3
</details>


## [31.1.2](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.1...v31.1.2) (2022-10-20)

### Bug fixes

* **[webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin)**: Fixed translations are not loaded from TypeScript source files. Closes [ckeditor/ckeditor5#12671](https://github.com/ckeditor/ckeditor5/issues/12671). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/3325333ef83dad16b859b55bf7586cf24004efea))

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `CKEditorWebpackPlugin` is added to the webpack configuration for DLL builds only when the `lang/` directory is present in the package directory. Closes [ckeditor/ckeditor5#12584](https://github.com/ckeditor/ckeditor5/issues/12584). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/05b99f5890f751733fdc9e87d115a537860ac8b4))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.1 => v31.1.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.1 => v31.1.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.1 => v31.1.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.1 => v31.1.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.1 => v31.1.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.1 => v31.1.2
</details>


## [31.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v31.1.0...v31.1.1) (2022-10-07)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Disabled watch mode for building manual tests when no files are provided. Closes [ckeditor/ckeditor5#12189](https://github.com/ckeditor/ckeditor5/issues/12189). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b6402f4d97f77d9bb0ea9acda473469b267d4214))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Debugging of manual tests should properly display TypeScript files. Debugging of automatic tests should remove the 'istanbul-instrumenter-loader' if the 'coverage' reporter was disabled by 'karma-config-overrides'. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/05fb508dca70b6c2a5dc8f4f37da161079ebc940))

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The dependency checker should recognize `import type` as dev dependencies. Closes [ckeditor/ckeditor5#12480](https://github.com/ckeditor/ckeditor5/issues/12480). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/68f333383788d6cb2d0c8eeacc4a2495097e0869))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.1.0 => v31.1.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.1.0 => v31.1.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.1.0 => v31.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.1.0 => v31.1.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.1.0 => v31.1.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.1.0 => v31.1.1
</details>


## [31.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v31.0.0...v31.1.0) (2022-09-19)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The manual test server will detect whether DLL builds are required when compiling manual tests. If so, it asks a user whether to build them before starting to compile tests. Closes [ckeditor/ckeditor5#12190](https://github.com/ckeditor/ckeditor5/issues/12190). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/71a7f9a4296e671149e4e981c7066ca131923278))

  Feature (tests) Added the `--dll` and `--no-dll` flags to the manual test server. Both are optional and allow avoiding asking whether to build DLL files. When passing `--dll`, the script will build them automatically. When passing `--no-dll`, the process of building DLLs will not be triggered.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v31.0.0 => v31.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v31.0.0 => v31.1.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v31.0.0 => v31.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v31.0.0 => v31.1.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v31.0.0 => v31.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v31.0.0 => v31.1.0
</details>


## [31.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v30.5.0...v31.0.0) (2022-09-09)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Changed syntax in the `--files` option for tests used to compile tests from a specific directory. Now, it requires a slash at the end.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Removed option of using simplified glob in filename option for tests.

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Split multi-scoped commit into multiple single-scoped commits, so the changelog generator can produce entries for all touched scopes. Closes [ckeditor/ckeditor5#10605](https://github.com/ckeditor/ckeditor5/issues/10605). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/2faea249a20f4bca55ff86020cadf5fefa6a6c5a))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added support for the testing environment to compile a single test. It touches both automated and manual tests. Read more about possible patterns in the [Rules for using the `--files` option](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/contributing/testing-environment.html#rules-for-using-the-files-option) section in CKEditor 5 documentation. Closes [ckeditor/ckeditor5#12251](https://github.com/ckeditor/ckeditor5/issues/12251). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/50ee152f23c59c5f87726b098e3e739b22e75c8c))

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Fixed manual tests reloading twice on every save. Closes [ckeditor/ckeditor5#12216](https://github.com/ckeditor/ckeditor5/issues/12216). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/010c5baaf5140ac2ecc27274a28841ab0baab06e))

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Manual tests should not load zoomed out on iOS. Closes [ckeditor/ckeditor5#12438](https://github.com/ckeditor/ckeditor5/issues/12438). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/42e36ae4369e29e3c1c2b7b0ec9c1bd512b70e89))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: When compiling manual tests, it is no longer necessary to specify the `manual/` directory in the `--files` option. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/50ee152f23c59c5f87726b098e3e739b22e75c8c))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.5.0 => v31.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.5.0 => v31.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.5.0 => v31.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.5.0 => v31.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.5.0 => v31.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.5.0 => v31.0.0
</details>


## [30.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/v30.4.0...v30.5.0) (2022-09-01)

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Added a new check during the release process that verifies if all required files exist in a package directory before releasing a package on npm. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/90022266836dd9ed246981218f1fa602b9a7627f))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added the `--resolve-js-first` option that prioritizes loading `*.js` over `*.ts` files for automated tests. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/78f69bce02a2232684f6ac2490c90ab6fec7568e))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added the `--cache` option that enables webpack cache for automated tests. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/78f69bce02a2232684f6ac2490c90ab6fec7568e))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.4.0 => v30.5.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.4.0 => v30.5.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.4.0 => v30.5.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.4.0 => v30.5.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.4.0 => v30.5.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.4.0 => v30.5.0
</details>


## [30.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v30.3.5...v30.4.0) (2022-08-04)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Display toast messages while manual tests are being compiled. Closes [ckeditor/ckeditor5#11831](https://github.com/ckeditor/ckeditor5/issues/11831). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b5a4d3f1f5621e6d1ba0265246bce66e0fe04ba0))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.3.5 => v30.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.3.5 => v30.4.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.3.5 => v30.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.3.5 => v30.4.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.3.5 => v30.4.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.3.5 => v30.4.0
</details>


## [30.3.5](https://github.com/ckeditor/ckeditor5-dev/compare/v30.3.4...v30.3.5) (2022-07-23)

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Support for TypeScript when collecting translation entries. Closes [ckeditor/ckeditor5#12029](https://github.com/ckeditor/ckeditor5/issues/12029). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ad5d50ebe9f389ddcda35362655c3f469c40d269))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.3.4 => v30.3.5
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.3.4 => v30.3.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.3.4 => v30.3.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.3.4 => v30.3.5
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.3.4 => v30.3.5
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.3.4 => v30.3.5
</details>


## [30.3.4](https://github.com/ckeditor/ckeditor5-dev/compare/v30.3.3...v30.3.4) (2022-07-21)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Override compiler options when processing test files to avoid errors when modifying source files when the watcher mode is enabled. Both tasks use `noEmit=false`. Additionally, for manual tests use `noEmitOnError=false`. For automated tests, use `noEmitOnError=true` to avoid running tests when the TypeScript compilator ends with an error Closes [ckeditor/ckeditor5#12111](https://github.com/ckeditor/ckeditor5/issues/12111). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/bcc9f7660e7c9831404d4ba3c25fa1bb377cbaa7))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.3.3 => v30.3.4
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.3.3 => v30.3.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.3.3 => v30.3.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.3.3 => v30.3.4
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.3.3 => v30.3.4
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.3.3 => v30.3.4
</details>


## [30.3.3](https://github.com/ckeditor/ckeditor5-dev/compare/v30.3.2...v30.3.3) (2022-07-20)

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Added support for paginated resource translations results from Transifex. Closes [ckeditor/ckeditor5#12098](https://github.com/ckeditor/ckeditor5/issues/12098). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c29b9fe11acb37d8a8fc2dcf83c27464af062d19))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Fixed usage of `isDevDependency()`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/7d97224eea25a1e153159516ddcd60ae78632014))

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Renaming the entry point extension from ".ts" to ".js" in the `main` field in the `package.json` files for each package written in TypeScript before the package is published to npm. After publishing, the original extension is restored. Closes [ckeditor/ckeditor5#12038](https://github.com/ckeditor/ckeditor5/issues/12038). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/12fc545bdeab33f3b53adcc6dc971cedaa91d3e4))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.3.2 => v30.3.3
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.3.2 => v30.3.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.3.2 => v30.3.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.3.2 => v30.3.3
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.3.2 => v30.3.3
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.3.2 => v30.3.3
</details>


## [30.3.2](https://github.com/ckeditor/ckeditor5-dev/compare/v30.3.1...v30.3.2) (2022-07-06)

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Added new method `getResourceTranslations()` in `lib/translations/transifex-service.js` for fetching all current translations from Transifex for specified resource and language. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d3a542b4754630d9c75c70c5c60e5c21d153b7a1))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Exposed new method `isSourceLanguage()` in `lib/translations/transifex-service.js` that checks if the specified language is the source language (English). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d3a542b4754630d9c75c70c5c60e5c21d153b7a1))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.3.1 => v30.3.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.3.1 => v30.3.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.3.1 => v30.3.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.3.1 => v30.3.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.3.1 => v30.3.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.3.1 => v30.3.2
</details>


## [30.3.1](https://github.com/ckeditor/ckeditor5-dev/compare/v30.3.0...v30.3.1) (2022-06-22)

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Adds support for TypeScript when building DLLs. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/db5ec2c28a3b77e31deff1ca926923cbdca4c2c4))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.3.0 => v30.3.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.3.0 => v30.3.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.3.0 => v30.3.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.3.0 => v30.3.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.3.0 => v30.3.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.3.0 => v30.3.1
</details>


## [30.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v30.2.0...v30.3.0) (2022-06-08)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Made it possible to run manual tests for features written in TS. Closes [ckeditor/ckeditor5#11717](https://github.com/ckeditor/ckeditor5/issues/11717). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0393dcc7fd8cd4bb7943146fb55be7f3ded4391d))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.2.0 => v30.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.2.0 => v30.3.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.2.0 => v30.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.2.0 => v30.3.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.2.0 => v30.3.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.2.0 => v30.3.0
</details>


## [30.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v30.1.5...v30.2.0) (2022-06-03)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added support for running automated tests for the TypeScript code. Closes [ckeditor/ckeditor5#11716](https://github.com/ckeditor/ckeditor5/issues/11716). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ada18752a8c79a4253235d81ac40fbc15273aca9))

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Properly detect console method usage in the asynchronous code and stop the whole test run if the `--production` flag is set. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/be2a38e9271e11a7cfb89abcf6ae5586b3fb9f72))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.1.5 => v30.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.1.5 => v30.2.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.1.5 => v30.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.1.5 => v30.2.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.1.5 => v30.2.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.1.5 => v30.2.0
</details>


## [30.1.5](https://github.com/ckeditor/ckeditor5-dev/compare/v30.1.4...v30.1.5) (2022-05-23)

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Passed the `noIsPseudoSelector` option to `postcss-nesting` for backward compatibility in browsers that do not support CSS `:is()`. Closes #[ckeditor/ckeditor5#11730](https://github.com/ckeditor/ckeditor5/issues/11730). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/34c16173e12baf9c88d492930dc6bfb52b6c01dc))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.1.4 => v30.1.5
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.1.4 => v30.1.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.1.4 => v30.1.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.1.4 => v30.1.5
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.1.4 => v30.1.5
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.1.4 => v30.1.5
</details>


## [30.1.4](https://github.com/ckeditor/ckeditor5-dev/compare/v30.1.3...v30.1.4) (2022-05-13)

### Other changes

* **[jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins)**: Allowed `FormData` and `URL` as a valid type in API docs. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/fec0d72022bd4408c16d61ea460dcd86683ec256))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.1.3 => v30.1.4

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.1.3 => v30.1.4
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.1.3 => v30.1.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.1.3 => v30.1.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.1.3 => v30.1.4
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.1.3 => v30.1.4
</details>


## [30.1.3](https://github.com/ckeditor/ckeditor5-dev/compare/v30.1.2...v30.1.3) (2022-04-15)

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Upgraded the PostCSS plugins to their latest versions due to producing the invalid CSS content. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/138d1510d8c16fe828bf224b3609f6577d66fed3))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.1.2 => v30.1.3
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.1.2 => v30.1.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.1.2 => v30.1.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.1.2 => v30.1.3
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.1.2 => v30.1.3
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.1.2 => v30.1.3
</details>


## [30.1.2](https://github.com/ckeditor/ckeditor5-dev/compare/v30.1.1...v30.1.2) (2022-04-14)

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The version of the following dependencies `postcss-mixins` and `postcss-nesting` was upgraded to use the PostCSS@8 API for declaring the plugins. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/888b81b064fa552b65f695e624b4842eca942ed4))

  Thanks, [@yoyo837](https://github.com/yoyo837).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.1.1 => v30.1.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.1.1 => v30.1.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.1.1 => v30.1.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.1.1 => v30.1.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.1.1 => v30.1.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.1.1 => v30.1.2
</details>


## [30.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v30.1.0...v30.1.1) (2022-04-12)

Internal changes only (updated dependencies, documentation, etc.).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.1.0 => v30.1.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.1.0 => v30.1.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.1.0 => v30.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.1.0 => v30.1.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.1.0 => v30.1.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.1.0 => v30.1.1
</details>


## [30.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v30.0.1...v30.1.0) (2022-03-30)

### Features

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Web crawler shows the full console error that has been captured. Closes [ckeditor/ckeditor5#11505](https://github.com/ckeditor/ckeditor5/issues/11505). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0e095f70e0484aa0e7d86cebc84226a302e5b060))
* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Web crawler listens to the `unhandledRejection` errors and marks the script execution as failed. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0e095f70e0484aa0e7d86cebc84226a302e5b060))

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Web crawler can now properly serialize objects and iterables that are passed to the console. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0e095f70e0484aa0e7d86cebc84226a302e5b060))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.0.1 => v30.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.0.1 => v30.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.0.1 => v30.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.0.1 => v30.1.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.0.1 => v30.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.0.1 => v30.1.0
</details>


## [30.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v30.0.0...v30.0.1) (2022-03-22)

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Removed the invalid "postcss" package defined as "peerDependencies". ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0c57fca20bebb3cb5823275f9de515ec99b42f0f))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v30.0.0 => v30.0.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v30.0.0 => v30.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v30.0.0 => v30.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v30.0.0 => v30.0.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v30.0.0 => v30.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v30.0.0 => v30.0.1
</details>


## [30.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v29.0.2...v30.0.0) (2022-03-22)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Upgraded the `postcss` version to 8 and marked the package as peer dependency instead of dependency. Starting from this version, when using the `@ckeditor/ckeditor5-dev-utils`, you need to manually install the `postcss` dependency.

### Features

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `styles.getPostCssConfig()` function returns a configuration compatible with `postcss@8`. See [ckeditor/ckeditor5#11460](https://github.com/ckeditor/ckeditor5/issues/11460). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/bda2a8ec1f0a6e48504be2fd14f577a34a346180))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v29.0.2 => v30.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v29.0.2 => v30.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v29.0.2 => v30.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v29.0.2 => v30.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v29.0.2 => v30.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v29.0.2 => v30.0.0
</details>


## [29.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/v29.0.1...v29.0.2) (2022-03-18)

### Other changes

* Downgraded the previous version of the `sinon` dependency due to errors while executing tests in CKEditor 5. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ef5e3e86840e710c991cf0b9d211f37ef8012019))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v29.0.1 => v29.0.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v29.0.1 => v29.0.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v29.0.1 => v29.0.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v29.0.1 => v29.0.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v29.0.1 => v29.0.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v29.0.1 => v29.0.2
</details>


## [29.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v29.0.0...v29.0.1) (2022-03-18)

### Other changes

* Bumped Karma test runner to `v6.x`. Closes [ckeditor/ckeditor5#11337](https://github.com/ckeditor/ckeditor5/issues/11337). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/bd5e23c73705e61ac261afb536124b0f066174a1))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v29.0.0 => v29.0.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v29.0.0 => v29.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v29.0.0 => v29.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v29.0.0 => v29.0.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v29.0.0 => v29.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v29.0.0 => v29.0.1
</details>


## [29.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v28.1.1...v29.0.0) (2022-03-18)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `url` option for `uploadPotFiles()` and `downloadTranslations()` is not supported anymore. Instead, use `organizationName` and `projectName` that represent organization and project names.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `uploadPotFiles()` task does not read anything from the file system automatically (removed the `translationsDirectory` option). A developer must pass the `cwd` option, which points to the project's root directory. Also, the `packages` map is required, which defines which packages should be processed. Keys in the map represent package names, while their values point to directories where to look for translation sources.

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Tools for translations use the latest version of the Transifex API (3.0). Improved the UI - these scripts print updates whenever a new step of the process starts. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a34b57755ad0822b6a1365d4b015ddd41b3c6491))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `upload()` and `download()` scripts stores resources that could not be processed (e.g., due to network issues). Only packages that failed during the previous run will be processed when re-running. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a34b57755ad0822b6a1365d4b015ddd41b3c6491))

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Fixed `changelog.getChangesForVersion()` util leaking to other releases. Closes [ckeditor/ckeditor5#11322](https://github.com/ckeditor/ckeditor5/issues/11322). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/bca6938240a793ceafb0d5c69708d5fa4d66fa9b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v28.1.1 => v29.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v28.1.1 => v29.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v28.1.1 => v29.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v28.1.1 => v29.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v28.1.1 => v29.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v28.1.1 => v29.0.0
</details>


## [28.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v28.1.0...v28.1.1) (2022-03-03)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Karma integrated with the IntelliJ IDE rebuilds the test bundle when detecting a change. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6279bcddded9aed8a6bdeb3ccf3e766bd3b6e1aa))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Paths to files are clickable from a console if a test fails. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6279bcddded9aed8a6bdeb3ccf3e766bd3b6e1aa))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Karma should not execute the test bundle twice when detecting a change (a macOS case). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6279bcddded9aed8a6bdeb3ccf3e766bd3b6e1aa))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v28.1.0 => v28.1.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v28.1.0 => v28.1.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v28.1.0 => v28.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v28.1.0 => v28.1.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v28.1.0 => v28.1.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v28.1.0 => v28.1.1
</details>


## [28.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v28.0.4...v28.1.0) (2022-02-25)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added `--identity-file` (`-i`) option for automated tests. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/68d079c34c8f57bd617116af7e1e531c602ce630))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v28.0.4 => v28.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v28.0.4 => v28.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v28.0.4 => v28.1.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v28.0.4 => v28.1.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v28.0.4 => v28.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v28.0.4 => v28.1.0
</details>


## [28.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/v28.0.3...v28.0.4) (2022-02-17)

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Added the missing "webpack" dependency in "package.json" which is a peer dependency of the `@ckeditor/ckeditor5-dev-utils` package. Closes [ckeditor/ckeditor5#11300](https://github.com/ckeditor/ckeditor5/issues/11300). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/43ef619beaeda725165af871227ffca023c962a4))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v28.0.3 => v28.0.4
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v28.0.3 => v28.0.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v28.0.3 => v28.0.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v28.0.3 => v28.0.4
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v28.0.3 => v28.0.4
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v28.0.3 => v28.0.4
</details>


## [28.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/v28.0.2...v28.0.3) (2022-02-17)

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Added handling for the `©` character when updating licenses. Closes [ckeditor/ckeditor5#11119](https://github.com/ckeditor/ckeditor5/issues/11119). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/5e71a3085109cc6126b3272362946c0f5aaba37f))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v28.0.2 => v28.0.3
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v28.0.2 => v28.0.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v28.0.2 => v28.0.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v28.0.2 => v28.0.3
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v28.0.2 => v28.0.3
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v28.0.2 => v28.0.3
</details>


## [28.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/v28.0.1...v28.0.2) (2022-02-03)

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Upgraded a version of the Puppeteer package to `13.1.3`. Closes [ckeditor/ckeditor5#11014](https://github.com/ckeditor/ckeditor5/issues/11014). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/8e82c65a6140c675488ac4305ead61012eb0253c))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v28.0.1 => v28.0.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v28.0.1 => v28.0.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v28.0.1 => v28.0.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v28.0.1 => v28.0.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v28.0.1 => v28.0.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v28.0.1 => v28.0.2
</details>


## [28.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v28.0.0...v28.0.1) (2022-01-20)

### Bug fixes

* **[jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins)**: Protected members should not be rendered in API docs. Closes [ckeditor/ckeditor5#11143](https://github.com/ckeditor/ckeditor5/issues/11143). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d85e2f95ac10d931cbadc6d15291b05b2d23ff7b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v28.0.0 => v28.0.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v28.0.0 => v28.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v28.0.0 => v28.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v28.0.0 => v28.0.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v28.0.0 => v28.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v28.0.0 => v28.0.1
</details>


## [28.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v27.4.0...v28.0.0) (2022-01-12)

This version contains updated copyrights in a license in all source files.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v27.4.0 => v28.0.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v27.4.0 => v28.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v27.4.0 => v28.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v27.4.0 => v28.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v27.4.0 => v28.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v27.4.0 => v28.0.0
</details>


## [27.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v27.3.0...v27.4.0) (2022-01-07)

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Created a script for updating versions of `ckeditor5` and `@ckeditor/ckeditor5-*` dependencies to a specified version. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/bfa664ba392cf7b21fd86de9ee5d018d10f93962))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v27.3.0 => v27.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v27.3.0 => v27.4.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v27.3.0 => v27.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v27.3.0 => v27.4.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v27.3.0 => v27.4.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v27.3.0 => v27.4.0
</details>


## [27.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v27.2.0...v27.3.0) (2022-01-04)

### Features

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Introduced the `tools.createSpinner()` function for creating spinners in CLI. Closes [ckeditor/ckeditor5#11067](https://github.com/ckeditor/ckeditor5/issues/11067). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/5ac2485f97b538156836195b02f5f65984268dae))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v27.2.0 => v27.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v27.2.0 => v27.3.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v27.2.0 => v27.3.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v27.2.0 => v27.3.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v27.2.0 => v27.3.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v27.2.0 => v27.3.0
</details>


## [27.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v27.1.1...v27.2.0) (2022-01-03)

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Created the script for bumping a year in license headers. Closes [ckeditor/ckeditor5#10909](https://github.com/ckeditor/ckeditor5/issues/10909). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/aab607d08be7bfafb5aa6d0adbe7c8b5102d68fb))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v27.1.1 => v27.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v27.1.1 => v27.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v27.1.1 => v27.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v27.1.1 => v27.2.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v27.1.1 => v27.2.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v27.1.1 => v27.2.0
</details>


## [27.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v27.1.0...v27.1.1) (2021-12-17)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Fixed generating source maps for manual and automated tests. Closes [ckeditor/ckeditor5#11006](https://github.com/ckeditor/ckeditor5/issues/11006). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e38ee2596e69ec5ea29591f3c0f2726408c22acd))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v27.1.0 => v27.1.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v27.1.0 => v27.1.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v27.1.0 => v27.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v27.1.0 => v27.1.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v27.1.0 => v27.1.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v27.1.0 => v27.1.1
</details>


## [27.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v27.0.0...v27.1.0) (2021-12-10)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added an option for disabling watchers in the manual test server. See: [ckeditor/ckeditor5#10982](https://github.com/ckeditor/ckeditor5/issues/10982). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ff7a411326427be7aa20f61f549f1142c42e5eb2))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v27.0.0 => v27.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v27.0.0 => v27.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v27.0.0 => v27.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v27.0.0 => v27.1.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v27.0.0 => v27.1.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v27.0.0 => v27.1.0
</details>


## [27.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v26.2.1...v27.0.0) (2021-12-09)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* Upgraded the minimal versions of Node.js to `14.0.0` due to the end of LTS.

### Other changes

* Updated the required version of Node.js to 14. See [ckeditor/ckeditor5#10972](https://github.com/ckeditor/ckeditor5/issues/10972). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6ba7fc4724f96aa5a2dd2f5dd0f19c4741a064b1))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v26.2.1 => v27.0.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v26.2.1 => v27.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v26.2.1 => v27.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v26.2.1 => v27.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v26.2.1 => v27.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v26.2.1 => v27.0.0
</details>


## [26.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v26.2.0...v26.2.1) (2021-12-08)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added the definition for `process/browser` in webpack configuration for the manual test server to fix the problem `"process is not defined"`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/637eeac5fff49f6bbcf34a4b41ba4784686bdaf1))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v26.2.0 => v26.2.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v26.2.0 => v26.2.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v26.2.0 => v26.2.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v26.2.0 => v26.2.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v26.2.0 => v26.2.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v26.2.0 => v26.2.1
</details>


## [26.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v26.1.0...v26.2.0) (2021-12-08)

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Packages starting with the `ckeditor-` prefix are not supported anymore.

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Upgraded the testing environment to webpack 5. See [ckeditor/ckeditor5#10668](https://github.com/ckeditor/ckeditor5/issues/10668). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f5c4bef1bad55f0795b86382c404f8977a8ddd58))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Dropped support for resolving packages starting with the `ckeditor-` prefix. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f5c4bef1bad55f0795b86382c404f8977a8ddd58))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v26.1.0 => v26.2.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v26.1.0 => v26.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v26.1.0 => v26.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v26.1.0 => v26.2.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v26.1.0 => v26.2.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v26.1.0 => v26.2.0
</details>


## [26.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v26.0.1...v26.1.0) (2021-11-24)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Created the `equalMarkup` and `attribute` chai assertions. They are loaded automatically when running tests. Closes [ckeditor/ckeditor5#9668](https://github.com/ckeditor/ckeditor5/issues/9668). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e2196083c58d8b1a99854ff2a08ab77dfa4846c1))

### Bug fixes

* **[jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins)**: When detecting doclets of the same member, remove a prefix for instance/static symbols. Closes [ckeditor/ckeditor5#8691](https://github.com/ckeditor/ckeditor5/issues/8691). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b36893b18326fbeb84ba84b7dc9375f7c70c9238))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v26.0.1 => v26.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v26.0.1 => v26.1.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v26.0.1 => v26.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v26.0.1 => v26.1.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v26.0.1 => v26.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v26.0.1 => v26.1.0
</details>


## [26.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v26.0.0...v26.0.1) (2021-11-18)

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: All numbers returned by the Transifex service will be cast to strings due to an error in the `cli-package`. See: [Automattic/cli-table#152](https://github.com/Automattic/cli-table/issues/152). Closes [ckeditor/ckeditor5#10861](https://github.com/ckeditor/ckeditor5/issues/10861). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/76611376ee9cefff85896fe0b116a5a654dd4a8b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v26.0.0 => v26.0.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v26.0.0 => v26.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v26.0.0 => v26.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v26.0.0 => v26.0.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v26.0.0 => v26.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v26.0.0 => v26.0.1
</details>


## [26.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v25.4.5...v26.0.0) (2021-11-18)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `createPotFiles()` function requires the `translationsDirectory` option, which points to the directory where all `*.po` files will be created.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `downloadTranslations()` function requires the following properties:`translationsDirectory` - an absolute path used for resolving paths to packages; `url` - Transifex API URL.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `upload()` function requires the following properties: `translationsDirectory`- points to the directory where all `*.po` files will be created; `url` - Transifex API URL.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed the `ckeditor5-dev-env-translations` binary script as it worked only for the CKEditor 5 project. Use the following functions instead: `const { createPotFiles, uploadPotFiles, downloadTranslations } = require( '@ckeditor/ckeditor5-dev-env' );`.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `uploadPotFiles()` and `downloadTranslations()` functions require the `token` value passed directly to the script. Use the `const getToken = require( '@ckeditor/ckeditor5-dev-env/lib/translations/gettoken' )` function for reading the input from the command line.

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: All functions in the `transifex-service.js` util require the `url` value when calling API.

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Redesigned the API for handling localization in CKEditor 5 sources. Now, the code can be shared in 3rd party plugins created by external developers. See [ckeditor/ckeditor5-package-generator#9](https://github.com/ckeditor/ckeditor5-package-generator/issues/9). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/048915a7ba24cba8ecb6280bab8dd4b87b8f7a38))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `createPotFiles()` function accepts new flags:. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/048915a7ba24cba8ecb6280bab8dd4b87b8f7a38))

  *  `ignoreUnusedCorePackageContexts` - when set to `true`, unused contexts from the `@ckeditor/ckeditor5-core` package will not be displayed as errors,
  * `skipLicenseHeader` - when set to `true`, created `*.po` files will not contain the CKEditor 5 license header.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `simplifyLicenseHeader()` function accepts a new flag (`simplifyLicenseHeader`) that allows skipping adding the contribute URL in generated `*.po` files. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/048915a7ba24cba8ecb6280bab8dd4b87b8f7a38))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.4.5 => v26.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.4.5 => v26.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.4.5 => v26.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.4.5 => v26.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.4.5 => v26.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.4.5 => v26.0.0
</details>


## [25.4.5](https://github.com/ckeditor/ckeditor5-dev/compare/v25.4.4...v25.4.5) (2021-10-26)

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `releaseSubRepositories()` task does not check the npm version if a package will not be published anyway. Closes [ckeditor/ckeditor5#10639](https://github.com/ckeditor/ckeditor5/issues/10639). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/8efbafbdc664a59fb011472ebd8096fd7314ce82))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.4.4 => v25.4.5
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.4.4 => v25.4.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.4.4 => v25.4.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.4.4 => v25.4.5
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.4.4 => v25.4.5
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.4.4 => v25.4.5
</details>


## [25.4.4](https://github.com/ckeditor/ckeditor5-dev/compare/v25.4.3...v25.4.4) (2021-09-23)

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `getPackagesToRelease()` function handles pre-release versions properly. Closes [ckeditor/ckeditor5#10583](https://github.com/ckeditor/ckeditor5/issues/10583). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ec16756e3de92e89bc933d706951d10b5bcb5798))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.4.3 => v25.4.4
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.4.3 => v25.4.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.4.3 => v25.4.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.4.3 => v25.4.4
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.4.3 => v25.4.4
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.4.3 => v25.4.4
</details>


## [25.4.3](https://github.com/ckeditor/ckeditor5-dev/compare/v25.4.2...v25.4.3) (2021-09-22)

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added in the Karma configuration a list of available plugins to avoid an error related to loading a non-registered plugin. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/69b1fec9378ee06d1fe89e2379d62c86507d2606))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.4.2 => v25.4.3
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.4.2 => v25.4.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.4.2 => v25.4.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.4.2 => v25.4.3
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.4.2 => v25.4.3
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.4.2 => v25.4.3
</details>


## [25.4.2](https://github.com/ckeditor/ckeditor5-dev/compare/v25.4.1...v25.4.2) (2021-08-30)

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The "generateChangelog()" util will not crash when merging "Updated translations." commits found in the private repositories. Closes [ckeditor/ckeditor5#10445](https://github.com/ckeditor/ckeditor5/issues/10445). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d3bc4954811747822990b337dd7b5bf9e231a099))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.4.1 => v25.4.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.4.1 => v25.4.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.4.1 => v25.4.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.4.1 => v25.4.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.4.1 => v25.4.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.4.1 => v25.4.2
</details>


## [25.4.1](https://github.com/ckeditor/ckeditor5-dev/compare/v25.4.0...v25.4.1) (2021-08-19)

### Bug fixes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The `tools.clean()` function will resolve paths correctly on Windows environments. Closes [ckeditor/ckeditor5#10141](https://github.com/ckeditor/ckeditor5/issues/10141). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/58d183695a2e180dcb7f00b9fcd8e62dcabc3b51))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.4.0 => v25.4.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.4.0 => v25.4.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.4.0 => v25.4.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.4.0 => v25.4.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.4.0 => v25.4.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.4.0 => v25.4.1
</details>


## [25.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v25.3.1...v25.4.0) (2021-08-12)

### Features

* **[webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin)**: Introduced several new options that improve the output files produced by the plugin. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4a6ed132f60ef6b981e77a612844a0960750f632))

  New options:
    * `corePackageContextsResourcePath` - (optional) a path to the file where all translation contexts are specified for the `ckeditor5-core` package. Defaults to `'@ckeditor/ckeditor5-core/lang/contexts.json'`.
    * `includeCorePackageTranslations` - (optional) a flag that determines whether all translations found in the core package should be added to the output bundle file. If set to `true`, translations from the core package will be saved even if they are not used in the source code (*.js files). Defaults to `false`.
    * `skipPluralFormFunction`- (optional) a flag that determines whether the `getPluralForm()` function should not be added in the output bundle file. Defaults to `false`.

### Other changes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The webpack configuration for DLL builds now produces the translation files. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4a6ed132f60ef6b981e77a612844a0960750f632))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.3.1 => v25.4.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.3.1 => v25.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.3.1 => v25.4.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.3.1 => v25.4.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.3.1 => v25.4.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.3.1 => v25.4.0
</details>


## [25.3.1](https://github.com/ckeditor/ckeditor5-dev/compare/v25.3.0...v25.3.1) (2021-08-11)

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: The web-crawler configuration now allows ignoring HTTPS errors. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/3e1af9470a59ac7b34a64150699296d50ff603ed))

  New options:

  * `ignoreHTTPSErrors` - (optional) a flag passed to the browser creator that allows ignoring HTTPS errors (e.g., when validating over HTTPS with a self-signed certificate). Defaults to `false`.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.3.0 => v25.3.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.3.0 => v25.3.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.3.0 => v25.3.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.3.0 => v25.3.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.3.0 => v25.3.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.3.0 => v25.3.1
</details>


## [25.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v25.2.6...v25.3.0) (2021-07-26)

### Features

* **[jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-jsdoc-plugins)**: Allowed DOMRect as a valid type in API docs. Closes [ckeditor/ckeditor5#10216](https://github.com/ckeditor/ckeditor5/issues/10216). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/8fbe39984d5ebb017bdbbf5d88d8d63eb4bd2cf5))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.2.6 => v25.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.2.6 => v25.3.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.2.6 => v25.3.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.2.6 => v25.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.2.6 => v25.3.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.2.6 => v25.3.0
</details>


## [25.2.6](https://github.com/ckeditor/ckeditor5-dev/compare/v25.2.5...v25.2.6) (2021-07-13)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Prevented `isDevDependency()` function from reading "theme" word from the `ckeditor5-theme-lark` package name. See [ckeditor/ckeditor5#9998](https://github.com/ckeditor/ckeditor5/issues/9998). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ecf792feef7bebccdf065a3147251187b7c6ff34))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.2.5 => v25.2.6
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.2.5 => v25.2.6
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.2.5 => v25.2.6
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.2.5 => v25.2.6
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.2.5 => v25.2.6
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.2.5 => v25.2.6
</details>


## [25.2.5](https://github.com/ckeditor/ckeditor5-dev/compare/v25.2.4...v25.2.5) (2021-07-12)

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Set the proper exit code when found an error when collecting translations. Closes [ckeditor/ckeditor5#10123](https://github.com/ckeditor/ckeditor5/issues/10123). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/36d1190feb0b0386533b88be431f05832b4a922a))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.2.4 => v25.2.5
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.2.4 => v25.2.5
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.2.4 => v25.2.5
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.2.4 => v25.2.5
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.2.4 => v25.2.5
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.2.4 => v25.2.5
</details>


## [25.2.4](https://github.com/ckeditor/ckeditor5-dev/compare/v25.2.3...v25.2.4) (2021-06-28)

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Set watermarks for code coverage reports so anything less than 100% is instantly visible. Closes [ckeditor/ckeditor5#9956](https://github.com/ckeditor/ckeditor5/issues/9956). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d194777447edd5c9203ae8c5ce25a6dc57a19707))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.2.3 => v25.2.4
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.2.3 => v25.2.4
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.2.3 => v25.2.4
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.2.3 => v25.2.4
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.2.3 => v25.2.4
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.2.3 => v25.2.4
</details>


## [25.2.3](https://github.com/ckeditor/ckeditor5-dev/compare/v25.2.2...v25.2.3) (2021-06-21)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Fixed a faulty regexp that did not care about Windows environments for manual tests. Closes [ckeditor/ckeditor5#9849](https://github.com/ckeditor/ckeditor5/issues/9849). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/48046b229e9d69bca6ca07c99f5bdb632fec8dc5))

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The Slack notifier script will read the commit message from GitHub API for a particular commit. If the `SLACK_NOTIFY_COMMIT_URL` variable is specified, the value will be treated as the commit. Otherwise, a concatenation of `TRAVIS_REPO_SLUG`, and `TRAVIS_COMMIT` variables will be used. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/2ae29b30e9c719abc7b45c8e314bb36188b98b9d))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The Slack notifier will print a message if a commit was made by a bot (as a result of merging branches). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/2ae29b30e9c719abc7b45c8e314bb36188b98b9d))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The Slack notifier script will work if a commit comes from the `#stable` branch. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/2ae29b30e9c719abc7b45c8e314bb36188b98b9d))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.2.2 => v25.2.3
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.2.2 => v25.2.3
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.2.2 => v25.2.3
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.2.2 => v25.2.3
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.2.2 => v25.2.3
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.2.2 => v25.2.3
</details>


## [25.2.2](https://github.com/ckeditor/ckeditor5-dev/compare/v25.2.1...v25.2.2) (2021-06-10)

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added the always visible button that navigates back to the list of manual tests. Refined the look of the list of manual tests. Closes [ckeditor/ckeditor5#9843](https://github.com/ckeditor/ckeditor5/issues/9843). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/102a966dd603f14b8531b7d9f11d2944821fbff0))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.2.1 => v25.2.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.2.1 => v25.2.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.2.1 => v25.2.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.2.1 => v25.2.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.2.1 => v25.2.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.2.1 => v25.2.2
</details>


## [25.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v25.2.0...v25.2.1) (2021-05-21)

### Other changes

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Support for the `options.noSpinner` flag when executing in terminals that do not support the spinner. Closes [ckeditor/ckeditor5#9737](https://github.com/ckeditor/ckeditor5/issues/9737). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c5edb5a5804b5f99d3656dba16988cc9d8c32b0c))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.2.0 => v25.2.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.2.0 => v25.2.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.2.0 => v25.2.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.2.0 => v25.2.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.2.0 => v25.2.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.2.0 => v25.2.1
</details>


## [25.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v25.1.0...v25.2.0) (2021-05-20)

### Features

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Allows disabling the sandbox mode for the web crawler. Closes [ckeditor/ckeditor5#9735](https://github.com/ckeditor/ckeditor5/issues/9735). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/489bf714a67b20de8f6873dba947dbbd735090ae))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.1.0 => v25.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.1.0 => v25.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.1.0 => v25.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.1.0 => v25.2.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.1.0 => v25.2.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.1.0 => v25.2.0
</details>


## [25.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v25.0.0...v25.1.0) (2021-05-19)

### Features

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Introduced a web crawler that allows verifying whether subpages under the specified URL can be opened without any errors. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ae7879b007704c2cf2f2253e5980a7aae51c1b93))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v25.0.0 => v25.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v25.0.0 => v25.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v25.0.0 => v25.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v25.0.0 => v25.1.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v25.0.0 => v25.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v25.0.0 => v25.1.0
</details>


## [25.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v24.4.2...v25.0.0) (2021-05-18)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: The webpack configuration returned by the `builds.getDllPluginWebpackConfig()` function will not export the default library (`libraryExport`) anymore. See [ckeditor/ckeditor5#9134](https://github.com/ckeditor/ckeditor5/issues/9134).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.4.2 => v25.0.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.4.2 => v25.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.4.2 => v25.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.4.2 => v25.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.4.2 => v25.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.4.2 => v25.0.0
</details>


## [24.4.2](https://github.com/ckeditor/ckeditor5-dev/compare/v24.4.1...v24.4.2) (2021-03-16)

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Ability to disable mentioning an author of the commit in the Slack notification by specifying the environment variable (`SLACK_NOTIFY_HIDE_AUTHOR="true"`). Closes [ckeditor/ckeditor5#9252](https://github.com/ckeditor/ckeditor5/issues/9252). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/3b35ba75e6d916efa70061dc2de0f02bff617023))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.4.1 => v24.4.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.4.1 => v24.4.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.4.1 => v24.4.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.4.1 => v24.4.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.4.1 => v24.4.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.4.1 => v24.4.2
</details>


## [24.4.1](https://github.com/ckeditor/ckeditor5-dev/compare/v24.4.0...v24.4.1) (2021-03-12)

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added the focus style for the colapse button in the manual tests template. Closes [ckeditor/ckeditor5#7987](https://github.com/ckeditor/ckeditor5/issues/7987). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/c567710c5457ecec99005fea805aa3b94c135dbd))

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added the `--silent` flag to the manual test server that allows hiding names of the processed files. Closes [ckeditor/ckeditor5#9220](https://github.com/ckeditor/ckeditor5/issues/9220). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b6dc12ef77342e0f08e0aead6f48c421237d90b2))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.4.0 => v24.4.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.4.0 => v24.4.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.4.0 => v24.4.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.4.0 => v24.4.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.4.0 => v24.4.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.4.0 => v24.4.1
</details>


## [24.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v24.3.0...v24.4.0) (2021-03-08)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The `notify-travis-status` script will mention an author of a commit that caused to fail the CI. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d0dcf250698a7b93e335a2c8e32dbdd32c1f0b7b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.3.0 => v24.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.3.0 => v24.4.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.3.0 => v24.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.3.0 => v24.4.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.3.0 => v24.4.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.3.0 => v24.4.0
</details>


## [24.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v24.2.0...v24.3.0) (2021-03-01)

### Features

* **[webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin)**: Support for Webpack 5. The plugin will also work with Webpack 4. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/986c2407bb1f5d3205a3822836313d9bd65eeb3e))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.2.0 => v24.3.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.2.0 => v24.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.2.0 => v24.3.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.2.0 => v24.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.2.0 => v24.3.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.2.0 => v24.3.0
</details>


## [24.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v24.1.0...v24.2.0) (2021-02-16)

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `bumpVersions()` function can read the changelog file from an external directory (using `options.changelogDirectory`). Thanks to that, the private packages from the mono-repository can be released using a public changelog. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/faa1d1e7aafa5f870e038e94b56a8e03fff48e4f))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `bumpVersions()` function allows skipping upgrading versions of dependencies between updated packages (using `options.skipUpdatingDependencies` which is `false` by default). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/faa1d1e7aafa5f870e038e94b56a8e03fff48e4f))

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Simplified a check whether a package was published on NPM in the `releaseSubRepositories()` function. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/faa1d1e7aafa5f870e038e94b56a8e03fff48e4f))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: A DLL-consumer package produced by webpack should be assigned to the `window` object. See [ckeditor/ckeditor5#9039](https://github.com/ckeditor/ckeditor5/issues/9039). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/72c063a3854b6336fcc8528c94887d04b9afa1cf))

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `bumpVersions()` function returns a promise with a collection that contains all updated packages. Previously the promise didn't resolve anything. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/faa1d1e7aafa5f870e038e94b56a8e03fff48e4f))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.1.0 => v24.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.1.0 => v24.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.1.0 => v24.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.1.0 => v24.2.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.1.0 => v24.2.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.1.0 => v24.2.0
</details>


## [24.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v24.0.2...v24.1.0) (2021-02-01)

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Support for collecting commits from additional mono-repositories in the `generateChangelogForMonoRepository()` function. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/3d7d5c2654f626e6644da3cd3bc88d5940024a67))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Added a module (`builds.getDllPluginWebpackConfig()`) that produces the webpack configuration for DLL. See [ckeditor/ckeditor5#8395](https://github.com/ckeditor/ckeditor5/issues/8395). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/7dad0adc149259d77371f2d6f42ec9213b11f075))

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The "releaserepositories.js" script should not throw an error if the "options.customReleasesFiles" option is not specified. Closes [ckeditor/ckeditor5#8932](https://github.com/ckeditor/ckeditor5/issues/8932). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/1726e5fb3fba0ef9d3dcdcd966760ce380c9246a))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.0.2 => v24.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.0.2 => v24.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.0.2 => v24.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.0.2 => v24.1.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.0.2 => v24.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.0.2 => v24.1.0
</details>


## [24.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/v24.0.1...v24.0.2) (2021-01-20)

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Minor improvements for the dependency checker that is exposed as a binary script by the `@ckeditor/ckeditor5-dev-tests` package (`ckeditor5-dev-tests-check-dependencies`). Closes https://github.com/ckeditor/ckeditor5/issues/8862. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6e27bc78c2ada87c2facc4b9f2efb4ea4b6dd956))

  - Added a flag `--quiet` that allows display logs only if found issues with dependencies,
  - If packages were not specified in arguments, all packages found in the `packages/` directory will be checked by default.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.0.1 => v24.0.2
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.0.1 => v24.0.2
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.0.1 => v24.0.2
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.0.1 => v24.0.2
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.0.1 => v24.0.2
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.0.1 => v24.0.2
</details>


## [24.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v24.0.0...v24.0.1) (2021-01-19)

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Changed packages in the generated changelog will be grouped properly by exact comparing their scopes instead of matching values. Closes [ckeditor/ckeditor5#8596](https://github.com/ckeditor/ckeditor5/issues/8596). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a825e12b63f122ef048ac347629db75b212bf1ab))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Improved the dependency checker in detecting missing, unused, or misplaced packages from JS, CSS, and `package.json` files. Closes [ckeditor/ckeditor5#8817](https://github.com/ckeditor/ckeditor5/issues/8817). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f74fc02260ad60cdaaeacad3333a5613c208fc03))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v24.0.0 => v24.0.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v24.0.0 => v24.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v24.0.0 => v24.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v24.0.0 => v24.0.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v24.0.0 => v24.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v24.0.0 => v24.0.1
</details>


## [24.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v23.6.1...v24.0.0) (2021-01-11)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Renamed `options.packageJsonForEmptyReleases` to `options.packageJsonForCustomReleases` in the `releaseSubRepositories()` function.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Renamed `options.emptyReleases` to `options.customReleases` in the `releaseSubRepositories()` function.

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The idea of having "emptyReleases" has been changed to "customReleases" that allows specifying which files from the original package should be copied. Introduced the `customReleasesFiles` option for the `releaseSubRepositories()` function. It allows specifying glob patterns of files that should be copied to the temporary directory from which the package will be published on npm. Closes [[ckeditor/ckeditor5#8616](https://github.com/ckeditor/ckeditor5/issues/8616)](https://github.com/ckeditor/ckeditor5/issues/8616). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/763e69d95048f006c6048c0014e574bc23246a8b))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Added the "--include-external-directory" to the translations:collect task that allows checking packages located in the "external/" directory. See [ckeditor/ckeditor5#7901](https://github.com/ckeditor/ckeditor5/issues/7901). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/2ab50ca526a7d7f45d5fef0167a8d27728b04233))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.6.1 => v24.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.6.1 => v24.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.6.1 => v24.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.6.1 => v24.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.6.1 => v24.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.6.1 => v24.0.0
</details>


## [23.6.1](https://github.com/ckeditor/ckeditor5-dev/compare/v23.6.0...v23.6.1) (2020-11-06)

Internal changes only (updated dependencies, documentation, etc.).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.6.0 => v23.6.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.6.0 => v23.6.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.6.0 => v23.6.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.6.0 => v23.6.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.6.0 => v23.6.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.6.0 => v23.6.1
</details>


## [23.6.0](https://github.com/ckeditor/ckeditor5-dev/compare/v23.5.1...v23.6.0) (2020-10-22)

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: `generateChangelogForMonoRepository()` accepts a new option `options.skipLinks` (which is `false` by default) to omit release and commit links in the generated changelog. Closes [ckeditor/ckeditor5#8167](https://github.com/ckeditor/ckeditor5/issues/8167). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4ef99ed3b8cb5e77adec58cd9943a19a99fda70b))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: `generateChangelogForSinglePackage()` accept an optional option: `options.releaseBranch` (which defaults to `master`). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/9c25333d283105853902a16c87b3f2cee655c130))

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `getNewVersionType()` util returns a proper version when generating the changelog for a single package. Closes [ckeditor/ckeditor5#8265](https://github.com/ckeditor/ckeditor5/issues/8265). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/9c25333d283105853902a16c87b3f2cee655c130))

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Improved linter error message for self-imports. Closes [ckeditor/ckeditor5#8245](https://github.com/ckeditor/ckeditor5/issues/8245). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/bbb54952335415fe8fded20e4926b024e34c7bd7))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.5.1 => v23.6.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.5.1 => v23.6.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.5.1 => v23.6.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.5.1 => v23.6.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.5.1 => v23.6.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.5.1 => v23.6.0
</details>


## [23.5.1](https://github.com/ckeditor/ckeditor5-dev/compare/v23.5.0...v23.5.1) (2020-09-04)

### Other changes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Builds triggered by "api" should be handled by the script that sends notifications to Slack. Closes [ckeditor/ckeditor5#8025](https://github.com/ckeditor/ckeditor5/issues/8025). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/7c053269563fb6ab6546381abd8ceb785ab9313f))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.5.0 => v23.5.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.5.0 => v23.5.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.5.0 => v23.5.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.5.0 => v23.5.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.5.0 => v23.5.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.5.0 => v23.5.1
</details>


## [23.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/v23.4.0...v23.5.0) (2020-09-04)

### Features

* **[docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)**: Added an option to make strict check while building the documentation. See [ckeditor/ckeditor5#7994](https://github.com/ckeditor/ckeditor5/issues/7994). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/759cad55ff9a837b74ec6afdcc5a349cdefb85ff))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.4.0 => v23.5.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.4.0 => v23.5.0

Other releases:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.4.0 => v23.5.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.4.0 => v23.5.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.4.0 => v23.5.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.4.0 => v23.5.0
</details>


## [23.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/v23.3.0...v23.4.0) (2020-09-02)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Introduced the `--repositories` (also known as `-r`) option that allows specifying a name of a repository (or repositories, separated by a comma, similar to the `--files` option) where the tool should look for packages that should be tested. Thanks to that, you do not have to specify all packages of a repository that was cloned into the `external/` directory. Closes [ckeditor/ckeditor5#7889](https://github.com/ckeditor/ckeditor5/issues/7889). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/1e8edca9f77b8435d5a2b210c5fa9d7a7ab8c11c))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.3.0 => v23.4.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.3.0 => v23.4.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.3.0 => v23.4.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.3.0 => v23.4.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.3.0 => v23.4.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.3.0 => v23.4.0
</details>


## [23.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/v23.2.0...v23.3.0) (2020-09-01)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Implemented the toggle button for the manual tests sidebar. Closes [ckeditor/ckeditor5#7962](https://github.com/ckeditor/ckeditor5/issues/7962). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e21464545ba78968dea804a52f8eea3852a51b33))

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The changelog generator now produces a commented out blog post placeholder by default. Closes [ckeditor/ckeditor5#7954](https://github.com/ckeditor/ckeditor5/issues/7954). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/8ce5f25f38c3eaad903b74306b7739794e27e940))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.2.0 => v23.3.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.2.0 => v23.3.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.2.0 => v23.3.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.2.0 => v23.3.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.2.0 => v23.3.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.2.0 => v23.3.0
</details>


## [23.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v23.1.1...v23.2.0) (2020-08-20)

### Features

* **[jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-jsdoc-plugins)**: Introduced a plugin that hides the package documentation if in the package's `package.json` file the `private` key is set to `true`. However, by adding the `@publicApi` annotation, you can mark blocks of the code that should not be hidden. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/374efa83b258e40b36a6451a288e494582f8c5ac))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Manual test server accepts a new flag: `--identity-file` (alias: `-i`) that allows defining global constants in manual tests. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/374efa83b258e40b36a6451a288e494582f8c5ac))

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Improved output displayed while the `translations.upload()` function is working. Instead of displaying `console.log()` after each package, summary tables will be displayed when the function finishes its job. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/fb88a3ed7450c148debbd4bdc5e2a1fbbd82b1f8))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Manual test script will not search for tests in the `./manual/_utils` directory. If any of a manual test requires additional utils to work, those can be placed in the `_utils` directory. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/374efa83b258e40b36a6451a288e494582f8c5ac))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.1.1 => v23.2.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.1.1 => v23.2.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.1.1 => v23.2.0

Other releases:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.1.1 => v23.2.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.1.1 => v23.2.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.1.1 => v23.2.0
</details>


## [23.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/v23.1.0...v23.1.1) (2020-08-05)

Internal changes only (updated dependencies, documentation, etc.).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.1.0 => v23.1.1
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.1.0 => v23.1.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.1.0 => v23.1.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.1.0 => v23.1.1
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.1.0 => v23.1.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.1.0 => v23.1.1
</details>


## [23.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v23.0.0...v23.1.0) (2020-08-03)

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Dependency checker will look for duplicated dependencies. Closes [ckeditor/ckeditor5#7706](https://github.com/ckeditor/ckeditor5/issues/7706). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/29ecdb282fe0acb9c993cd2d59643f5116ad59bb))
* **[webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin)**: Add support for the `translationsOutputFile` option for `CKEditorWebpackPlugin` allowing specifying the target bundle for translations. Closes [ckeditor/ckeditor5#7688](https://github.com/ckeditor/ckeditor5/issues/7688). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f385e09f0be5bc5bb40fee8af68006760bb07e2c))

### Bug fixes

* **[jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-jsdoc-plugins)**: Whitespaces from code blocks should be removed properly. Closes [ckeditor/ckeditor5#7742](https://github.com/ckeditor/ckeditor5/issues/7742). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/71a1637474ff4d9451fa76a24be6472514601497))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v23.0.0 => v23.1.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v23.0.0 => v23.1.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v23.0.0 => v23.1.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v23.0.0 => v23.1.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v23.0.0 => v23.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v23.0.0 => v23.1.0
</details>


## [23.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v22.0.0...v23.0.0) (2020-07-21)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-jsdoc-plugins)**: Functions documented in a module will no longer be documented as static functions. Therefore links to functions will not contain the `static-` part and links created in the past will no longer work.

### Features

* **[jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-jsdoc-plugins)**: Updated JSDoc and align custom JSDoc plugins. Part of [ckeditor/ckeditor5#7575](https://github.com/ckeditor/ckeditor5/issues/7575). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/755e29cde71f67332554cb4bc0c23982651bb524))

  * Improved performance,
  * Fixed incorrectly and inconsistently documented functions. Previously they were marked as static/instance using the `.` or `#` symbols. Now they are documented the same as classes, interfaces, and mixins using the `~` symbol. (e.g. `module:widget/utils~toWidget`),
  * Validator was improved, now it detects duplicated modules and previously hidden mistakes.
  * Updated JSDoc allows for modern JS syntax, `async/await` among others.

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v22.0.0 => v23.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v22.0.0 => v23.0.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v22.0.0 => v23.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v22.0.0 => v23.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v22.0.0 => v23.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v22.0.0 => v23.0.0
</details>


## [22.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v21.0.0...v22.0.0) (2020-07-20)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Task `generateChangelogForMonoRepository()` will generate the changelog uses the same version for all packages.

### Features

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added `sinon-chai` to automated tests. Closes https://github.com/ckeditor/ckeditor5/issues/7456. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e82040e6a17e87bae6b450df29e5ac7084b5e5be))

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `getCommit()` util will return a proper array with commits if the release branch in the project is other than `master`. Due to `--first-parent` flag which is used for collecting the commits, when the release branch is other than `master`, commits made on `master` could not be collected directly from the branch. Now those commits are collected in two ranges: from the last tag to the [base commit](https://git-scm.com/docs/git-merge-base) and from the base commit to HEAD and merged together. Closes [ckeditor/ckeditor5#7492](https://github.com/ckeditor/ckeditor5/issues/7492). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e18db62d33c11dbe2a98a845e46cbde73186fa9d))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Scoped breaking changes notes won't be duplicated in the changelog. Closes [ckeditor/ckeditor5#7495](https://github.com/ckeditor/ckeditor5/issues/7495). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e4eefa669bce9a8d1ccca6ce1c92914a17151825))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Commit and note groups should be sorted properly. Closes [ckeditor/ckeditor5#7496](https://github.com/ckeditor/ckeditor5/issues/7496). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a08020cbb29bf62cabc28a71926278abe32f54bf))

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `generateChangelogForMonoRepository()` task supports `options.releaseBranch` that is passed directly to the `getCommit()` util. See [ckeditor/ckeditor5#7492](https://github.com/ckeditor/ckeditor5/issues/7492). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e18db62d33c11dbe2a98a845e46cbde73186fa9d))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The changelog generator for mono repository will use the same version for all packages. On the screen, a user will see all changes: `MAJOR BREAKING CHANGES`, `MINOR BREAKING CHANGES`, and all commits since the last release. The user must review it and provide the version. Closes [ckeditor/ckeditor5#7323](https://github.com/ckeditor/ckeditor5/issues/7323). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4036b6e359238db764be695f7491e7e3e85901bd))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Merge commits between `stable/release/master` branches will be ignored when generating the changelog, to reduce the noise. Closes [ckeditor/ckeditor5#7489](https://github.com/ckeditor/ckeditor5/issues/7489). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/cedc53f350aef74621f80f8a2e953d18892f5c52))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v21.0.0 => v22.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v21.0.0 => v22.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v21.0.0 => v22.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v21.0.0 => v22.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v21.0.0 => v22.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v21.0.0 => v22.0.0
</details>


## [21.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v20.2.1...v21.0.0) (2020-06-22)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* Minimal version of Node.js for all packages included in the repository has been increased to 12.0.0.

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Translation tools can handle external packages outside the CKEditor 5 repository. Closes [ckeditor/ckeditor5#6635](https://github.com/ckeditor/ckeditor5/issues/6635). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/5771fc51e716754babcb89e37dbb13bfbf832118))

### Bug fixes

* When typed `"skip"` as a new version, the changelog generator should abort the process instead of writing invalid entries to the changelog file. Closes [ckeditor/ckeditor5#7402](https://github.com/ckeditor/ckeditor5/issues/7402). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/682d31e304692f513df9c92a87de56153c04fbc3))

### Other changes

* Upgraded versions of all dependencies. See [ckeditor/ckeditor5#7202](https://github.com/ckeditor/ckeditor5/issues/7202). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f771fb0221db07f802bbdf0da1450fe5d79314c9))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v20.0.0 => v21.0.0
* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v20.2.0 => v21.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v20.0.2 => v21.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v20.0.0 => v21.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v20.0.0 => v21.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v20.0.0 => v21.0.0
* [eslint-config-ckeditor5](https://www.npmjs.com/package/eslint-config-ckeditor5): v2.1.0 => v3.0.0
* [eslint-plugin-ckeditor5-rules](https://www.npmjs.com/package/eslint-plugin-ckeditor5-rules): v0.0.5 => v1.0.0
* [stylelint-config-ckeditor5](https://www.npmjs.com/package/stylelint-config-ckeditor5): v1.0.3 => v2.0.0
</details>


## [20.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/v20.2.0...v20.2.1) (2020-06-01)

Internal changes only (updated dependencies, documentation, etc.).

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v20.0.1 => v20.0.2
</details>


## [20.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/v20.1.0...v20.2.0) (2020-05-31)

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Release commit will trigger a Continuous Integration service. Closes [ckeditor/ckeditor5#7302](https://github.com/ckeditor/ckeditor5/issues/7302). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e3495c82ff447b49882cc58d485f2c2d7cda665f))

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The changelog generator will properly merge the `Closes` references. Closes [ckeditor/ckeditor5#7298](https://github.com/ckeditor/ckeditor5/issues/7298). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4f0737da0d10168547ec8b523d4df36cb958dcff))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: References to issues in additional commits will be merged and linked. See [ckeditor/ckeditor5#7298](https://github.com/ckeditor/ckeditor5/issues/7298). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4f0737da0d10168547ec8b523d4df36cb958dcff))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `releaseSubRepositories()` task should not throw any error if publishing from the non-master branch. Closes [ckeditor/ckeditor5#7300](https://github.com/ckeditor/ckeditor5/issues/7300). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e74f022e3270e9aeafca6c8ede39ce43d9433095))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v20.1.0 => v20.2.0
</details>


## [20.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/v20.0.0...v20.1.0) (2020-05-27)

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Allows releasing packages from the non-master branch. Closes [ckeditor/ckeditor5#7271](https://github.com/ckeditor/ckeditor5/issues/7271). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d5ad37b15c6c33cac0cbe7eb113f5bd477edc114))

### Bug fixes

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The getRelativeFilePath() util will return proper paths for CKEditor 5 builds. Closes [ckeditor/ckeditor5#7280](https://github.com/ckeditor/ckeditor5/issues/7280). Closes [ckeditor/ckeditor5#7093](https://github.com/ckeditor/ckeditor5/issues/7093). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ccd299e24974285606d2110ddd5e7fc438f14186))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v20.0.0 => v20.1.0

Other releases:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v20.0.0 => v20.0.1
</details>


## [20.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/ckeditor5-dev@6.4.3...v20.0.0) (2020-05-22)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `generateChangelogForSubPackages()` task. Use `generateChangelogForMonoRepository()` instead.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `generateChangelogForSubRepositories()` task. Use `generateChangelogForMonoRepository()` instead if your repository is a monorepository.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `generateSummaryChangelog()` task.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: CKEditor 5 release tools now are designed to work with monorepo architecture.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Following binary commands were removed:
  * `ckeditor5-dev-tests-travis`
  * `ckeditor5-dev-tests-prepare-mrgit-json`
  * `ckeditor5-dev-tests-prepare-package-json`
  * `ckeditor5-dev-tests-install-dependencies`
  * `ckeditor5-dev-tests-save-revision`

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed support for the `NOTE` type of commit's notes.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `hasMajorBreakingChanges()` and `hasMinorBreakingChanges()` utils from `/lib/release-tools/utils/changelog.js` helper.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed the `getNewReleaseType()` util. Use `getCommits()` and `getNewVersionType()` instead.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `getSubPackagesPaths()` util.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Renamed `getSubRepositoriesPaths()` util to `getPackagesPaths()`.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The util `getPackagesPaths()` does not check whether packages are defined as `dependencies` in `package.json` in the main repository.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Task `generateChangelogForSinglePackage()` does not accept options: `newVersion`, `disableMajorBump`, `isInternalRelease`, `indentLevel`, `useExplicitBreakingChangeGroups` anymore. The task should be used for generating the changelog for the single repository.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Moved all utils from `/lib/release-tools/utils/transform-commit` to `/lib/release-tools/utils`.

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Support for multi-entries messages in the single commit and scoped changes. Closes [ckeditor/ckeditor5#7207](https://github.com/ckeditor/ckeditor5/issues/7207), [ckeditor/ckeditor5#7171](https://github.com/ckeditor/ckeditor5/issues/7171). See [Git commit message convention guide](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/contributing/git-commit-message-convention.html). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Added new utils that help to collect commits, parsing them, and generating the changelog. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))

  *   The util for generating changelog from commits (those must be specified as an argument). See `/lib/release-tools/utils/generatechangelog.js`
  *   The util for collecting commits. See `/lib/release-tools/utils/getcommits.js`
  *   The util for suggesting new version based on commits. See `/lib/release-tools/utils/getnewversiontype.js`
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Task `generateChangelogForSinglePackage()` supports new options: `from` - a commit or tag for collecting commits since the last release, `highlightsPlaceholder` - whether to add "Release highlights" placeholder in the changelog, `collaborationFeatures` - whether to add a URL to collaboration features changelog. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Introduced the `--port` flag allowing to customize port number for automated tests server. Closes [#637](https://github.com/ckeditor/ckeditor5-dev/issues/637). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/9144675985e7957d8f11279a92325239bba4127d))

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `getChangedFilesForCommit()` util filters files returned by the Git command. It won't return an empty string anymore. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))

### Other changes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Adjusted release tools to handle single mono-repository architecture. Closes [#606](https://github.com/ckeditor/ckeditor5-dev/issues/606). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6a4dfb24ffb472027ef93144cea0d73e0744c587))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Commits in the changelog will display the word `commit` instead of the first 7 characters from the commit's hash. In big repositories (the number of commits is huge), 7 characters are not unique anymore. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: `Closes` references will be merged into a single entry. Github does not support such references (`Closes x, y`) but it can be simplified during the commit's transformation. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `provideVersion()` util from `lib/release-tools/utils/cli.js` allows disabling returning `skip` version by setting its option `disableSkipVersion` to `true`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Removed unnecessary scripts after merging the main repository to the monorepo. Closes [#628](https://github.com/ckeditor/ckeditor5-dev/issues/628). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e2048e95181c971c221171e33cde86fe990a97af))
* Removed `lerna` and all its files from the project. Now the release process is handled by our tools. The entire repository will follow the same rules as `ckeditor5.` Read more in the [Versioning policy guide](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v18.0.1 => v20.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v11.1.1 => v20.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v19.2.0 => v20.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v13.0.1 => v20.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v9.0.2 => v20.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v3.0.9 => v20.0.0
</details>
