Changelog
=========

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

Releases containing new features:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v22.0.0 => v23.0.0

Other releases:

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v22.0.0 => v23.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v22.0.0 => v23.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v22.0.0 => v23.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v22.0.0 => v23.0.0
* [eslint-config-ckeditor5](https://www.npmjs.com/package/eslint-config-ckeditor5): v3.0.0 => v23.0.0
* [eslint-plugin-ckeditor5-rules](https://www.npmjs.com/package/eslint-plugin-ckeditor5-rules): v1.0.0 => v23.0.0
* [stylelint-config-ckeditor5](https://www.npmjs.com/package/stylelint-config-ckeditor5): v2.0.0 => v23.0.0
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
