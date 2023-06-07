Changelog
=========

## [38.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v38.0.0...v38.0.1) (2023-06-07)

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Fixed scoped package to have a flat structure in the release directory. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0cd79786864d34132c76d5b83f730188fee30fe3))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: When preparing a configuration for a DLL build, a JavaScript file should take precedence over the TypeScript version as it might differ from the source code. Closes [ckeditor/ckeditor5#14335](https://github.com/ckeditor/ckeditor5/issues/14335). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/68941409fb46c8de9901428fce37954b254ec895))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v38.0.0 => v38.0.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler): v38.0.0 => v38.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v38.0.0 => v38.0.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins): v38.0.0 => v38.0.1
</details>


## [38.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v37.0.1...v38.0.0) (2023-06-02)

### Release highlights

This release brings the redesigned tools and utils for releasing packages to npm. They have been designed with the following criteria:

* Automate the process so it can be done with as little interaction from the releaser as possible.
* Make the process bulletproof so more people can trigger it.
* To enable publishing nightly versions of the packages.
* To enable extending the release process by defining a new step easily.

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The following tasks and utils are no longer available: `preparePackages()`, `bumpVersions()`, `updateCKEditor5Dependencies()`, `updateDependenciesVersions()`, `releaseSubRepositories()`.

  The `releaseTools.bumpVersions()` and `releaseTools.preparePackages()` tasks should be replaced with the following code snippet:

  ```js
  const releaseTools = require( '@ckeditor/ckeditor5-dev-release-tools' );

  await releaseTools.validateRepositoryToRelease( /* options */ )
  await releaseTools.updateVersions( /* options */ )
  await releaseTools.updateDependencies( /* options */ )
  await releaseTools.prepareRepository( /* options */ )
  await releaseTools.cleanUpPackages( /* options */ )
  await releaseTools.commitAndTag( /* options */ )
  ```

  The `releaseTools.releaseSubRepositories( /* options */ )` task should be replaced with the following code snippet:

  ```js
  const releaseTools = require( '@ckeditor/ckeditor5-dev-release-tools' );

  await releaseTools.publishPackages( /* options */ )
  await releaseTools.createGithubRelease( /* options */ )
  await releaseTools.push( /* options */ )
  ```

  By default, the `releaseTools.publishPackages()` uses the `@staging` [npm tag](https://docs.npmjs.com/cli/v9/commands/npm-dist-tag). To make it public (available as `@latest`), use the `releaseTools.reassignNpmTags()`.

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Introduced several new tasks and utils for preparing the packages to release:. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))

  * `updateDependencies()` – updates dependencies (dev and peer too) to the specified version,
  * `updateVersions()` – bumps the `#version` key in a `package.json` file,
  * `prepareRepository()` – copies packages from a source directory to a destination that can be used as a source when publishing packages to npm,
  * `commitAndTag()` – creates a commit and connects a release tag with it,
  * `createGithubRelease()` – creates a GitHub release page for the given version,
  * `push()` – executes the `git push` command,
  * `cleanUpPackages()` – removes unnecessary files and entries in a package.json for each package to publish,
  * `publishPackages()` – validates if packages are ready to publish, then deploy them to npm,
  * `reassignNpmTags()` – switches npm tags for the specified packages,
  * `executeInParallel()` – util allowing executing a given task in parallel for all packages.
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Introduced util called `truncateChangelog()` that allows reducing the changelog size to the requested number of entries. See [ckeditor/ckeditor5#14169](https://github.com/ckeditor/ckeditor5/issues/14169). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/fe6e2d8956c8bdd3e2ac73d7f40dc12fc15259b3))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added karma notification for when the tests are completed. Notification can be enabled with `-n`/`--notify` CLI option. Its enabled by default when running all tests, without the `-f`/`--files` option. Closes [ckeditor/ckeditor5#13736](https://github.com/ckeditor/ckeditor5/issues/13736). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d1a5898c4520f8f7a7208152c7d82b27c761b403))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: `tools.shExec()` can resolve a promise if the `async: true` is specified in the `options` argument. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: `tools.shExec()` allows defining the working directory as `options.cwd`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: `tools.createSpinner()` allows creating a spinner with a counter by defining the `options.total` value. To increase the displayed number, use the `#increase()` method on the returned object. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))

### Bug fixes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Fixed crash in the Travis notifier script if an author of a commit could not be obtained. Instead, ping the entire channel and mention an author from its name instead of a login that can be `null`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f32f08f4e9aeef99b49063d191d115f33a9f2370))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: When running automated tests in the "production" mode, warnings will be treated as errors. It allows the detection of webpack messages that may impact a build but does not break the process. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4f8ea77bdaa94ee645bff1070ea332f1764a0836))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The manual and automated test environments do not report a warning regarding the missing `timers` module. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/4f8ea77bdaa94ee645bff1070ea332f1764a0836))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Fixed `equalMarkup` assertion to print raw (unformatted) strings if formatted markup is equal. Closes [ckeditor/ckeditor5#14175](https://github.com/ckeditor/ckeditor5/issues/14175). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/06cc6b3fcfa23448dc48de02908bbb4c957a854c))
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Properties with the `@observable` annotation hooked into accessor reflections were not processed when creating the `change:*` and `set:*` events. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/91f5443eb0a0672dd671df604ffe216d3f2d0f2b))

### Other changes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Puppeteer no longer prints a warning regarding the Chrome Headless browser. See [ckeditor/ckeditor5#14063](https://github.com/ckeditor/ckeditor5/issues/14063). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a641d0fe4ea91f788ea180a489470df9d19a839b))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Support for running manual and automated tests written in TypeScript. Remember that test runners do not validate types as we use `esbuild` which ignores it. Closes [ckeditor/ckeditor5#14170](https://github.com/ckeditor/ckeditor5/issues/14170), [ckeditor/ckeditor5#14171](https://github.com/ckeditor/ckeditor5/issues/14171). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/5600a20f16717e547f07ebfef7c6fbcc4078cbc3))
* Updated the `glob` dependency to use the latest version in all packages. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools): v37.0.1 => v38.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year): v37.0.1 => v38.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci): v37.0.1 => v38.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker): v37.0.1 => v38.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v37.0.1 => v38.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v37.0.1 => v38.0.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex): v37.0.1 => v38.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations): v37.0.1 => v38.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v37.0.1 => v38.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler): v37.0.1 => v38.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v37.0.1 => v38.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins): v37.0.1 => v38.0.0
</details>


## [38.0.0-alpha.0](https://github.com/ckeditor/ckeditor5-dev/compare/v37.0.1...v38.0.0-alpha.0) (2023-05-24)

### Release highlights

This release brings the redesigned tools and utils for releasing packages to npm. They have been designed with the following criteria:

* Automate the process so it can be done with as little interaction from the releaser as possible.
* Make the process bulletproof so more people can trigger it.
* To enable publishing nightly versions of the packages.
* To enable extending the release process by defining a new step easily.

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The following tasks and utils are no longer available: `preparePackages()`, `bumpVersions()`, `updateCKEditor5Dependencies()`, `updateDependenciesVersions()`, `releaseSubRepositories()`.

  The `releaseTools.bumpVersions()` and `releaseTools.preparePackages()` tasks should be replaced with the following code snippet: 

  ```js
  const releaseTools = require( '@ckeditor/ckeditor5-dev-release-tools' );

  await releaseTools.validateRepositoryToRelease( /* options */ )
  await releaseTools.updateVersions( /* options */ )
  await releaseTools.updateDependencies( /* options */ )
  await releaseTools.prepareRepository( /* options */ )
  await releaseTools.cleanUpPackages( /* options */ )
  await releaseTools.commitAndTag( /* options */ )
  ```

  The `releaseTools.releaseSubRepositories( /* options */ )` task should be replaced with the following code snippet:

  ```js
  const releaseTools = require( '@ckeditor/ckeditor5-dev-release-tools' );

  await releaseTools.publishPackages( /* options */ )
  await releaseTools.createGithubRelease( /* options */ )
  await releaseTools.push( /* options */ )
  ```

  By default, the `releaseTools.publishPackages()` uses the `@staging` [npm tag](https://docs.npmjs.com/cli/v9/commands/npm-dist-tag). To make it public (available as `@latest`), use the `releaseTools.reassignNpmTags()`.

### Features

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Introduced several new tasks and utils for preparing the packages to release:. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))

    * `updateDependencies()` – updates dependencies (dev and peer too) to the specified version,
    * `updateVersions()` – bumps the `#version` key in a `package.json` file,
    * `prepareRepository()` – copies packages from a source directory to a destination that can be used as a source when publishing packages to npm,
    * `commitAndTag()` – creates a commit and connects a release tag with it,
    * `createGithubRelease()` – creates a GitHub release page for the given version,
    * `push()` – executes the `git push` command,
    * `cleanUpPackages()` – removes unnecessary files and entries in a package.json for each package to publish,
    * `publishPackages()` – validates if packages are ready to publish, then deploy them to npm,
    * `reassignNpmTags()` – switches npm tags for the specified packages,
    * `executeInParallel()` – util allowing executing a given task in parallel for all packages.
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Added karma notification for when the tests are completed. Notification can be enabled with `-n`/`--notify` CLI option. Its enabled by default when running all tests, without the `-f`/`--files` option. Closes [ckeditor/ckeditor5#13736](https://github.com/ckeditor/ckeditor5/issues/13736). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/d1a5898c4520f8f7a7208152c7d82b27c761b403))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: `tools.shExec()` can resolve a promise if the `async: true` is specified in the `options` argument. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: `tools.shExec()` allows defining the working directory as `options.cwd`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))
* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: `tools.createSpinner()` allows creating a spinner with a counter by defining the `options.total` value. To increase the displayed number, use the `#increase()` method on the returned object. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))

### Bug fixes

* **[ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)**: Fixed crash in the Travis notifier script if an author of a commit could not be obtained. Instead, ping the entire channel and mention an author from its name instead of a login that can be `null`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/f32f08f4e9aeef99b49063d191d115f33a9f2370))
* **[typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)**: Properties with the `@observable` annotation hooked into accessor reflections were not processed when creating the `change:*` and `set:*` events. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/91f5443eb0a0672dd671df604ffe216d3f2d0f2b))

### Other changes

* **[web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)**: Puppeteer no longer prints a warning regarding the Chrome Headless browser. See [ckeditor/ckeditor5#14063](https://github.com/ckeditor/ckeditor5/issues/14063). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/a641d0fe4ea91f788ea180a489470df9d19a839b))
* Updated the `glob` dependency to use the latest version in all packages. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/b573b07f86dce1dbac8fefb74a70b0ba5e46eeae))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v37.0.1 => v38.0.0-alpha.0

Other releases:

* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler): v37.0.1 => v38.0.0-alpha.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins): v37.0.1 => v38.0.0-alpha.0
</details>


## [37.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/v37.0.0...v37.0.1) (2023-04-13)

### Bug fixes

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Moved the ck-debug-loader from the ckeditor5-dev-tests package to ckeditor5-dev-utils. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/befd2fb53b1b5eefed168b81d880f5e30141fc8a))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v37.0.0 => v37.0.1
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler): v37.0.0 => v37.0.1
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v37.0.0 => v37.0.1
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins): v37.0.0 => v37.0.1
</details>


## [37.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v36.0.1...v37.0.0) (2023-04-13)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Replaced `ts-loader` with `esbuild-loader` in manual and automated tests to improve the build time. See [ckeditor/ckeditor5#13643](https://github.com/ckeditor/ckeditor5/issues/13643).

### Features

* **[utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)**: Exports a new object called `loaders` containing several methods for configuring webpack. Available helpers present as follow. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/17642b06c34a0fb0750fb34f42263511a782181b))

    * `getTypeScriptLoader()` – returns a configuration for processing TypeScript files using esbuild,
    * `getJavaScriptLoader()` – returns a configuration for enabling `CK_DEBUG` flags in JavaScript files,
    * `getStylesLoader()` – returns a configuration for processing CSS files using PostCSS,
    * `getIconsLoader()` – returns a configuration for loading SVG icons using `raw-loader`,
    * `getFormattedTextLoader()` – returns a configuration for loading rich text files using `raw-loader`,
    * `getCoverageLoader()` – returns a configuration that installs instruments for measuring the code coverage.

### Bug fixes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `updateCKEditor5Dependencies()` task should take care of the `ckeditor5-collaboration` package too. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/ef85d0dafc421c76fc399f71c6318784a074804e))
* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: The `releaseSubRepositories()` task will now check the correct tag when checking what version is currently published on npm. Closes [ckeditor/ckeditor5#13737](https://github.com/ckeditor/ckeditor5/issues/13737). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/fa29daa1ca5e4c15478e9255bfb056aa18ec4bb9))

### Other changes

* **[release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)**: Mark GitHub release as a pre-release when publishing a non-latest version. Closes [ckeditor/ckeditor5#13664](https://github.com/ckeditor/ckeditor5/issues/13664). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/3e522c739482789ddaf2a767dc72bb45469159c7))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Use loader helpers exported by the `@ckeditor/ckeditor5-dev-utils` package to create webpack configurations for automated and manual tests. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/17642b06c34a0fb0750fb34f42263511a782181b))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: The `source-map` option is enabled by default due to converting TypeScript into JavaScript. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/17642b06c34a0fb0750fb34f42263511a782181b))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Releases containing new features:

* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v36.0.1 => v37.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v36.0.1 => v37.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-bump-year](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year): v36.0.1 => v37.0.0
* [@ckeditor/ckeditor5-dev-ci](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci): v36.0.1 => v37.0.0
* [@ckeditor/ckeditor5-dev-dependency-checker](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker): v36.0.1 => v37.0.0
* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v36.0.1 => v37.0.0
* [@ckeditor/ckeditor5-dev-release-tools](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools): v36.0.1 => v37.0.0
* [@ckeditor/ckeditor5-dev-transifex](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex): v36.0.1 => v37.0.0
* [@ckeditor/ckeditor5-dev-translations](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations): v36.0.1 => v37.0.0
* [@ckeditor/ckeditor5-dev-web-crawler](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler): v36.0.1 => v37.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v36.0.1 => v37.0.0
* [@ckeditor/typedoc-plugins](https://www.npmjs.com/package/@ckeditor/typedoc-plugins): v36.0.1 => v37.0.0
</details>

---

To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).
