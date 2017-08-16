Changelog
=========

## [5.1.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.4...@ckeditor/ckeditor5-dev-env@5.1.5) (2017-08-16)

### Bug fixes

* "Publish" commits will not be parsed when generating the changelog. Closes [#220](https://github.com/ckeditor/ckeditor5-dev/issues/220). ([7501a6b](https://github.com/ckeditor/ckeditor5-dev/commit/7501a6b))
* `cli.confirmRelease()` shouldn't reject the promise if the user did not confirm the process. Closes [#245](https://github.com/ckeditor/ckeditor5-dev/issues/245). ([d57f9c8](https://github.com/ckeditor/ckeditor5-dev/commit/d57f9c8))


## [5.1.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.2...@ckeditor/ckeditor5-dev-env@5.1.4) (2017-08-09)

### Other changes

* The release process will now be error-proof by performing validation before starting taking any actions. Closes [#99](https://github.com/ckeditor/ckeditor5-dev/issues/99). Closes [#147](https://github.com/ckeditor/ckeditor5-dev/issues/147).  Closes: [#149](https://github.com/ckeditor/ckeditor5-dev/issues/149). Closes: [#151](https://github.com/ckeditor/ckeditor5-dev/issues/151). ([330a8dc](https://github.com/ckeditor/ckeditor5-dev/commit/330a8dc))


## [5.1.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.0...@ckeditor/ckeditor5-dev-env@5.1.2) (2017-06-14)

Internal changes only (updated dependencies, documentation, etc.).

## [5.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.0.1...@ckeditor/ckeditor5-dev-env@5.1.0) (2017-05-24)

### Bug fixes

* Changed the method for gathering files modified by a commit. Closes [#207](https://github.com/ckeditor/ckeditor5-dev/issues/207). ([cf79c4d](https://github.com/ckeditor/ckeditor5-dev/commit/cf79c4d))

### Features

* Added "internal" option to the version picker. Closes [#184](https://github.com/ckeditor/ckeditor5-dev/issues/184). ([ec43528](https://github.com/ckeditor/ckeditor5-dev/commit/ec43528))

  If you'll type "internal" as a new version during generating the changelog, all commits will be ignored when generating the changelog but the version will be bumped.

### Other changes

* Release tool will use `npm version` command for bumping the version. Closes [#213](https://github.com/ckeditor/ckeditor5-dev/issues/213). ([d72ccd4](https://github.com/ckeditor/ckeditor5-dev/commit/d72ccd4))

  It allows using the `preversion` and `postversion` npm hooks.


## [5.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.0.0...@ckeditor/ckeditor5-dev-env@5.0.1) (2017-05-16)

### Bug fixes

* Cached `pot` files will be cleaned before new ones are collected. Closes [#181](https://github.com/ckeditor/ckeditor5-dev/issues/181). ([da5b1f7](https://github.com/ckeditor/ckeditor5-dev/commit/da5b1f7))
* Changelog for internal changes will be followed by two blank lines instead of one. Closes [#188](https://github.com/ckeditor/ckeditor5-dev/issues/188). ([bb16c0d](https://github.com/ckeditor/ckeditor5-dev/commit/bb16c0d))
* Changelog utils won't throw an error if the changelog file does not exist. Closes [#187](https://github.com/ckeditor/ckeditor5-dev/issues/187). ([9b946fd](https://github.com/ckeditor/ckeditor5-dev/commit/9b946fd))
* Closed tickets should not be hoisted to the first line of a changelog item. Closes [#161](https://github.com/ckeditor/ckeditor5-dev/issues/161). ([bf8aa79](https://github.com/ckeditor/ckeditor5-dev/commit/bf8aa79))
* Complex, multiline commits will be parsed correctly. Closes [#146](https://github.com/ckeditor/ckeditor5-dev/issues/146). ([25c2d71](https://github.com/ckeditor/ckeditor5-dev/commit/25c2d71))


## [5.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@4.4.3...@ckeditor/ckeditor5-dev-env@5.0.0) (2017-04-27)

### Bug fixes

* The task for uploading translations will not throw anymore. Closes [#174](https://github.com/ckeditor/ckeditor5-dev/issues/174). ([a3b619d](https://github.com/ckeditor/ckeditor5-dev/commit/a3b619d))

### Features

* A task for generating changelogs in a monorepo was introduced. Several other improvements were made on the occasion. Closes [#148](https://github.com/ckeditor/ckeditor5-dev/issues/148). Closes [#121](https://github.com/ckeditor/ckeditor5-dev/issues/121). Closes [#110](https://github.com/ckeditor/ckeditor5-dev/issues/110). Closes [#96](https://github.com/ckeditor/ckeditor5-dev/issues/96). ([fefc1de](https://github.com/ckeditor/ckeditor5-dev/commit/fefc1de))

### BREAKING CHANGES

* Task `tasks.generateChangelog()` has been renamed to `tasks.generateChangelogForSinglePackage()`.
* Task `generateChangelogForDependencies()` has been renamed to `tasks.generateChangelogForSubRepositories()`.
* Task `tasks.createRelease()` has been renamed to `tasks.releaseRepository()`.
* Task `tasks.releaseDependencies()` has been renamed to `tasks.releaseSubRepositories()`.

### NOTE

* Introduced a new task – `tasks.generateChangelogForSubRepositories()`.


## 4.4.3

The big bang.
