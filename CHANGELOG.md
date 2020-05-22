Changelog
=========

## [20.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v6.4.3...v20.0.0) (2020-05-22)

### MAJOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `generateChangelogForSubPackages()` task. Use `generateChangelogForMonoRepository()` instead.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `generateChangelogForSubRepositories()` task. Use `generateChangelogForMonoRepository()` instead if your repository is a monorepository.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `generateSummaryChangelog()` task.
* CKEditor 5 release tools now are designed to work with monorepo architecture.
* Following binary commands were removed:
* `ckeditor5-dev-tests-travis`
* `ckeditor5-dev-tests-prepare-mrgit-json`
* `ckeditor5-dev-tests-prepare-package-json`
* `ckeditor5-dev-tests-install-dependencies`
* `ckeditor5-dev-tests-save-revision`

### MINOR BREAKING CHANGES [ℹ️](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html#major-and-minor-breaking-changes)

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The util `getPackagesPaths()` does not check whether packages are defined as `dependencies` in `package.json` in the main repository.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Task `generateChangelogForSinglePackage()` does not accept options: `newVersion`, `disableMajorBump`, `isInternalRelease`, `indentLevel`, `useExplicitBreakingChangeGroups` anymore. The task should be used for generating the changelog for the single repository.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `hasMajorBreakingChanges()` and `hasMinorBreakingChanges()` utils from `/lib/release-tools/utils/changelog.js` helper.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed `getSubPackagesPaths()` util.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed the `getNewReleaseType()` util. Use `getCommits()` and `getNewVersionType()` instead.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Removed support for the `NOTE` type of commit's notes.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Moved all utils from `/lib/release-tools/utils/transform-commit` to `/lib/release-tools/utils`.
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Renamed `getSubRepositoriesPaths()` util to `getPackagesPaths()`.

### Features

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Support for multi-entries messages in the single commit and scoped changes. Closes [[ckeditor/ckeditor5#7207](https://github.com/ckeditor/ckeditor5/issues/7207)](https://github.com/ckeditor/ckeditor5/issues/7207). Closes [[ckeditor/ckeditor5#7171](https://github.com/ckeditor/ckeditor5/issues/7171)](https://github.com/ckeditor/ckeditor5/issues/7171). See https://ckeditor.com/docs/ckeditor5/latest/framework/guides/contributing/git-commit-message-convention.html. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Added new utils that help to collect commits, parsing them, and generating the changelog. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))

  *   The util for generating changelog from commits (those must be specified as an argument). See `/lib/release-tools/utils/generatechangelog.js`
  *   The util for collecting commits. See `/lib/release-tools/utils/getcommits.js`
  *   The util for suggesting new version based on commits. See `/lib/release-tools/utils/getnewversiontype.js`
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Task `generateChangelogForSinglePackage()` supports new options: `from` - a commit or tag for collecting commits since the last release, `highlightsPlaceholder` - whether to add "Release highlights" placeholder in the changelog, `collaborationFeatures` - whether to add a URL to collaboration features changelog. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* Make port number configurable for automated tests server. Closes [#637](https://github.com/ckeditor/ckeditor5-dev/issues/637). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/9144675985e7957d8f11279a92325239bba4127d))

### Bug fixes

* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `getChangedFilesForCommit()` util filters files returned by the Git command. It won't return an empty string anymore. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))

### Other changes

* **[ckeditor5](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ckeditor5)**: Adjusted release tools to handle single mono-repository architecture. Closes [#606](https://github.com/ckeditor/ckeditor5-dev/issues/606). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/6a4dfb24ffb472027ef93144cea0d73e0744c587))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: Commits in the changelog will display the word `commit` instead of the first 7 characters from the commit's hash. In big repositories (the number of commits is huge), 7 characters are not unique anymore. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: `Closes` references will be merged into a single entry. Github does not support such references (`Closes x, y`) but it can be simplified during the commit's transformation. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env)**: The `provideVersion()` util from `lib/release-tools/utils/cli.js` allows disabling returning `skip` version by setting its option `disableSkipVersion` to `true`. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))
* **[tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)**: Removed unnecessary scripts after merging the main repository to the monorepo. Closes [#628](https://github.com/ckeditor/ckeditor5-dev/issues/628). ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/e2048e95181c971c221171e33cde86fe990a97af))

  MAJOR BREAKING CHANGES: Following binary commands were removed:
  * `ckeditor5-dev-tests-travis`
  * `ckeditor5-dev-tests-prepare-mrgit-json`
  * `ckeditor5-dev-tests-prepare-package-json`
  * `ckeditor5-dev-tests-install-dependencies`
  * `ckeditor5-dev-tests-save-revision`
* Removed `lerna` and all its files from the project. Now the release process is handled by our tools. The entire repository will follow the same rules as `ckeditor5.` Read more: https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html. ([commit](https://github.com/ckeditor/ckeditor5-dev/commit/0f19f52c71207c8f1be57ac2b1ab1c9fc032f3e9))

### Released packages

Check out the [Versioning policy](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html) guide for more information.

<details>
<summary>Released packages (summary)</summary>

Major releases (contain major breaking changes):

* [@ckeditor/ckeditor5-dev-env](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env): v18.0.1 => v20.0.0

Releases containing new features:

* [@ckeditor/ckeditor5-dev-docs](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs): v11.1.1 => v20.0.0
* [@ckeditor/ckeditor5-dev-tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests): v19.2.0 => v20.0.0
* [@ckeditor/ckeditor5-dev-utils](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils): v13.0.1 => v20.0.0
* [@ckeditor/ckeditor5-dev-webpack-plugin](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin): v9.0.2 => v20.0.0
* [@ckeditor/jsdoc-plugins](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins): v3.0.9 => v20.0.0
</details>
