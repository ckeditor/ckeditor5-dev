Changelog
=========

## [10.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.1.0...@ckeditor/ckeditor5-dev-tests@10.2.0) (2017-12-21)

### Other changes

* Switched from CodeClimate to Coveralls. Closes [#348](https://github.com/ckeditor/ckeditor5-dev/issues/348). ([2238b04](https://github.com/ckeditor/ckeditor5-dev/commit/2238b04))


## [10.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.0.5...@ckeditor/ckeditor5-dev-tests@10.1.0) (2017-12-20)

### Features

* Restored previous Karma behavior. Tests will be compiled to a single entry point. Closes [#290](https://github.com/ckeditor/ckeditor5-dev/issues/290). ([e0acc1a](https://github.com/ckeditor/ckeditor5-dev/commit/e0acc1a))
* Tests can be executed using BrowserStack. Closes [#334](https://github.com/ckeditor/ckeditor5-dev/issues/334). ([25109ff](https://github.com/ckeditor/ckeditor5-dev/commit/25109ff))

### Bug fixes

* Karma will not execute the tests multiple times when works in watch mode. Closes [#346](https://github.com/ckeditor/ckeditor5-dev/issues/346). ([1a6b3ad](https://github.com/ckeditor/ckeditor5-dev/commit/1a6b3ad))

### NOTE

* In order to execute tests using BrowserStack, you need to call `BROWSER_STACK_USERNAME=[...] BROWSER_STACK_ACCESS_KEY=[...] npm test -- --browsers=[...]`.


## [10.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.0.4...@ckeditor/ckeditor5-dev-tests@10.0.5) (2017-12-01)

### Bug fixes

* Reverting Friday's mistake v2. Closes [#320](https://github.com/ckeditor/ckeditor5-dev/issues/320). ([ee8fdc5](https://github.com/ckeditor/ckeditor5-dev/commit/ee8fdc5))


## [10.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.0.3...@ckeditor/ckeditor5-dev-tests@10.0.4) (2017-12-01)

### Bug fixes

* Reverting Friday's mistake. ([7443782](https://github.com/ckeditor/ckeditor5-dev/commit/7443782))


## [10.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.0.0...@ckeditor/ckeditor5-dev-tests@10.0.3) (2017-12-01)

### Bug fixes

* Increase available memory for all tests. Closes [#320](https://github.com/ckeditor/ckeditor5-dev/issues/320). ([208f656](https://github.com/ckeditor/ckeditor5-dev/commit/208f656))


## [10.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@9.2.0...@ckeditor/ckeditor5-dev-tests@10.0.0) (2017-11-30)

### Features

* Added support for multiple themes in output builds. Migrated various utilities from SASS to PostCSS. Closes [#321](https://github.com/ckeditor/ckeditor5-dev/issues/321). ([908e3af](https://github.com/ckeditor/ckeditor5-dev/commit/908e3af))


## [9.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@9.1.0...@ckeditor/ckeditor5-dev-tests@9.2.0) (2017-11-24)

Reverted the fix for [#290](https://github.com/ckeditor/ckeditor5-dev/issues/290). ([5c3d9ec](https://github.com/ckeditor/ckeditor5-dev/commit/5c3d9ec))

## [9.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@9.0.0...@ckeditor/ckeditor5-dev-tests@9.1.0) (2017-11-24)

### Features

* Changed a way how the tests are executed. Karma will receive a single entry point which will import all tests. Closes [#290](https://github.com/ckeditor/ckeditor5-dev/issues/290). ([5fc685f](https://github.com/ckeditor/ckeditor5-dev/commit/5fc685f))

### Bug fixes

* Disabled initial compilation of manual tests by the file watcher. Closes [#318](https://github.com/ckeditor/ckeditor5-dev/issues/318). ([aa72c3f](https://github.com/ckeditor/ckeditor5-dev/commit/aa72c3f))
* Manual tests will work in Windows environments properly. Closes: [#325](https://github.com/ckeditor/ckeditor5-dev/issues/325). ([615b93e](https://github.com/ckeditor/ckeditor5-dev/commit/615b93e))
* Webpack SVG loader will work properly on Windows machines. Closes [#323](https://github.com/ckeditor/ckeditor5-dev/issues/323). ([652849e](https://github.com/ckeditor/ckeditor5-dev/commit/652849e))


## [9.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@8.2.5...@ckeditor/ckeditor5-dev-tests@9.0.0) (2017-11-13)

### Other changes

* Removed gulp dependency across the whole project. Closes [#296](https://github.com/ckeditor/ckeditor5-dev/issues/296). ([723bee5](https://github.com/ckeditor/ckeditor5-dev/commit/723bee5))

  Now all packages use only npm scripts. Depending on usage you might either create a `"script"` entry in `pacakge.json` to invoke bin executables or require the library into a script.

  * Package `ckeditor5-dev-env` exposes new `translations` binary.
  * Package `ckeditor5-dev-tests` exposes new `test:manual` binary.
  * Removed `gulp-jsdoc3` from `ckeditor5-dev-docs`. Now `jsdoc` is invoked directly.
  * Removed `options` param from logger methods. Logger no longer uses `gutil.log` method.

### BREAKING CHANGES

* Gulp tasks were removed. New npm scripts were introduced.


## [8.2.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@8.2.2...@ckeditor/ckeditor5-dev-tests@8.2.5) (2017-11-10)

Internal changes only (updated dependencies, documentation, etc.).

## [8.2.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@8.2.1...@ckeditor/ckeditor5-dev-tests@8.2.2) (2017-10-01)

Internal changes only (updated dependencies, documentation, etc.).

## [8.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@8.2.0...@ckeditor/ckeditor5-dev-tests@8.2.1) (2017-09-22)

### Bug fixes

* Dependency checker will warn about non-relative links to itself. Closes [#282](https://github.com/ckeditor/ckeditor5-dev/issues/282). ([36d64e7](https://github.com/ckeditor/ckeditor5-dev/commit/36d64e7))


## [8.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@8.1.0...@ckeditor/ckeditor5-dev-tests@8.2.0) (2017-09-15)

### Features

* Introduced "dependency-checker" which allows validating whether used dependencies are specified in `package.json`. Closes [#278](https://github.com/ckeditor/ckeditor5-dev/issues/278). ([9574a97](https://github.com/ckeditor/ckeditor5-dev/commit/9574a97))


## [8.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@8.0.2...@ckeditor/ckeditor5-dev-tests@8.1.0) (2017-09-01)

### Features

* Other support for importing CSS files in manual tests. Closes [#267](https://github.com/ckeditor/ckeditor5-dev/issues/267). ([be4d3af](https://github.com/ckeditor/ckeditor5-dev/commit/be4d3af))


## [8.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@8.0.0...@ckeditor/ckeditor5-dev-tests@8.0.2) (2017-08-18)

Internal changes only (updated dependencies, documentation, etc.).

## [8.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@7.5.0...@ckeditor/ckeditor5-dev-tests@8.0.0) (2017-08-09)

Internal changes only (updated dependencies, documentation, etc.).


## [7.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@7.4.7...@ckeditor/ckeditor5-dev-tests@7.5.0) (2017-07-18)

### Features

* The `create-mgit-json` script will now use the hashes of dependencies defined in `package.json`. Closes [#243](https://github.com/ckeditor/ckeditor5-dev/issues/243). ([908c0d6](https://github.com/ckeditor/ckeditor5-dev/commit/908c0d6))


## [7.4.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@7.4.4...@ckeditor/ckeditor5-dev-tests@7.4.7) (2017-06-14)

Internal changes only (updated dependencies, documentation, etc.).

## [7.4.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@7.4.3...@ckeditor/ckeditor5-dev-tests@7.4.4) (2017-05-17)

### Bug fixes

* The `packages/` dir needs to be ignored when cloning subpackages on Travis. Closes [#203](https://github.com/ckeditor/ckeditor5-dev/issues/203). ([0b4080f](https://github.com/ckeditor/ckeditor5-dev/commit/0b4080f))


## [7.4.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@7.4.2...@ckeditor/ckeditor5-dev-tests@7.4.3) (2017-05-16)

### Bug fixes

* The test tool needs to install eslint-config-ckeditor5 on Travis. ([787418b](https://github.com/ckeditor/ckeditor5-dev/commit/787418b))

## 7.4.2 (2017-05-16)

Internal changes only (updated dependencies, documentation, etc.).


## [7.4.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@7.4.0...@ckeditor/ckeditor5-dev-tests@7.4.1) (2017-04-27)

Internal changes only (updated dependencies, documentation, etc.).


## 7.4.0

The big bang.
