Changelog
=========

## [6.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@5.0.0...@ckeditor/ckeditor5-dev-utils@6.0.0) (2017-11-30)

### Features

* Implement TranslationService v2 (ckeditor5-dev part). Closes [ckeditor/ckeditor5#666](https://github.com/ckeditor/ckeditor5/issues/666). Closes [ckeditor/ckeditor5#624](https://github.com/ckeditor/ckeditor5/issues/624). ([ee2a1d2](https://github.com/ckeditor/ckeditor5-dev/commit/ee2a1d2))

### BREAKING CHANGES

* `CKEditorWebpackPlugin` plugin supports now `language` and `additionalLanguages` options instead of `languages`. If only `language` is set, the plugin will translate code directly into the main bundle. When `additionalLanguages` are provided, then the plugin will output bundle with the main language and rest translation files separately.


## [5.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@4.0.2...@ckeditor/ckeditor5-dev-utils@5.0.0) (2017-11-13)

### Other changes

* Removed gulp dependency across the whole project. Closes [#296](https://github.com/ckeditor/ckeditor5-dev/issues/296). ([723bee5](https://github.com/ckeditor/ckeditor5-dev/commit/723bee5))

  Now all packages use only npm scripts. Depending on usage you might either create a `"script"` entry in `pacakge.json` to invoke bin executables or require the library into a script.

  * Package `ckeditor5-dev-env` exposes new `translations` binary.
  * Package `ckeditor5-dev-tests` exposes new `test:manual` binary.
  * Removed `gulp-jsdoc3` from `ckeditor5-dev-docs`. Now `jsdoc` is invoked directly.
  * Removed `options` param from logger methods. Logger no longer uses `gutil.log` method.

### BREAKING CHANGES

* Gulp tasks were removed. New npm scripts were introduced.


## [4.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@4.0.0...@ckeditor/ckeditor5-dev-utils@4.0.2) (2017-10-01)

Internal changes only (updated dependencies, documentation, etc.).

## [4.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@3.0.6...@ckeditor/ckeditor5-dev-utils@4.0.0) (2017-09-07)

### Other changes

* Changed the `bundler.createEntryFile()` output so the entry file defines a default export. Closes [#275](https://github.com/ckeditor/ckeditor5-dev/issues/275). ([57c581c](https://github.com/ckeditor/ckeditor5-dev/commit/57c581c))

### BREAKING CHANGES

* The `bundler.createEntryFile()`'s output has been changed.


## [3.0.6](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@3.0.5...@ckeditor/ckeditor5-dev-utils@3.0.6) (2017-09-01)

### Bug fixes

* Fixed invalid require() call which used package name instead of relative path which caused weird issues. ([342c675](https://github.com/ckeditor/ckeditor5-dev/commit/342c675))


## [3.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@3.0.3...@ckeditor/ckeditor5-dev-utils@3.0.5) (2017-09-01)

### Bug fixes

* Add better network error handling for downloading and uploading translations. Closes [#265](https://github.com/ckeditor/ckeditor5-dev/issues/265). ([c12fb15](https://github.com/ckeditor/ckeditor5-dev/commit/c12fb15))


## [3.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@3.0.0...@ckeditor/ckeditor5-dev-utils@3.0.3) (2017-08-18)

Internal changes only (updated dependencies, documentation, etc.).

## [3.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@2.6.2...@ckeditor/ckeditor5-dev-utils@3.0.0) (2017-05-29)

### Other changes

* `createEntryFile()` util will inline the editor config copied from the build configuration file. Closes [#217](https://github.com/ckeditor/ckeditor5-dev/issues/217). ([7180dca](https://github.com/ckeditor/ckeditor5-dev/commit/7180dca))

  [Read more why it is required and important.](https://github.com/ckeditor/ckeditor5-build-classic/issues/10#issuecomment-303398682)

### BREAKING CHANGES

* `createEntryFile()` function does not accept the `configPath` argument any more. You need to pass the configuration object as `options.config` instead of it.


## [2.6.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@2.6.0...@ckeditor/ckeditor5-dev-utils@2.6.2) (2017-05-24)

Internal changes only (updated dependencies, documentation, etc.).

## [2.6.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@2.5.1...@ckeditor/ckeditor5-dev-utils@2.6.0) (2017-04-27)

### Features

* The way how `TranslationService` resolves paths to PO files is now configurable. Closes [#167](https://github.com/ckeditor/ckeditor5-dev/issues/167). ([6e04aa9](https://github.com/ckeditor/ckeditor5-dev/commit/6e04aa9))


## 2.5.1

The big bang.
