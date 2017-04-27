Changelog
=========

## [5.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@4.4.3...@ckeditor/ckeditor5-dev-env@5.0.0) (2017-04-27)

### Bug fixes

* The task for uploading translations will not throw anymore. Closes [#174](https://github.com/ckeditor/ckeditor5-dev/issues/174). ([a3b619d](https://github.com/ckeditor/ckeditor5-dev/commit/a3b619d))

### Features

* A task for generating changelogs in a monorepo was introduced. Several other improvements were made on the occasion. Closes [#148](https://github.com/ckeditor/ckeditor5-dev/issues/148). Closes [#121](https://github.com/ckeditor/ckeditor5-dev/issues/121). Closes [#110](https://github.com/ckeditor/ckeditor5-dev/issues/110). Closes [#96](https://github.com/ckeditor/ckeditor5-dev/issues/96). ([fefc1de](https://github.com/ckeditor/ckeditor5-dev/commit/fefc1de))

  BREAKING CHANGES: Task `tasks.generateChangelog()` has been renamed to `tasks.generateChangelogForSinglePackage()`.

  BREAKING CHANGES: Task `generateChangelogForDependencies()` has been renamed to `tasks.generateChangelogForSubRepositories()`.

  BREAKING CHANGES: Task `tasks.createRelease()` has been renamed to `tasks.releaseRepository()`.

  BREAKING CHANGES: Task `tasks.releaseDependencies()` has been renamed to `tasks.releaseSubRepositories()`.

  NOTE: Introduced a new task – `tasks.generateChangelogForSubRepositories()`.

### BREAKING CHANGES

* Task `tasks.generateChangelog()` has been renamed to `tasks.generateChangelogForSinglePackage()`.
* Task `generateChangelogForDependencies()` has been renamed to `tasks.generateChangelogForSubRepositories()`.
* Task `tasks.createRelease()` has been renamed to `tasks.releaseRepository()`.
* Task `tasks.releaseDependencies()` has been renamed to `tasks.releaseSubRepositories()`.
### NOTE

* Introduced a new task – `tasks.generateChangelogForSubRepositories()`.


## 4.4.3

The big bang.
