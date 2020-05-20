Changelog
=========

All changes in the package are documented in the main repository. See: https://github.com/ckeditor/ckeditor5-dev/blob/master/CHANGELOG.md.

Changes for the past releases are available below.

## [13.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@13.0.0...@ckeditor/ckeditor5-dev-utils@13.0.1) (2020-04-28)

### Bug fixes

* Added support for advanced structures of messages inside `t()` calls. Closes [#622](https://github.com/ckeditor/ckeditor5-dev/issues/622). ([c21919b](https://github.com/ckeditor/ckeditor5-dev/commit/c21919b))


## [13.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.9...@ckeditor/ckeditor5-dev-utils@13.0.0) (2020-04-23)

### BREAKING CHANGES

* Omitting the language property in the `CKEditorWebpackPlugin` will not have any effect from now. This means that in both cases only the main `language` will be added to the main bundle and translations for other languages will be saved in separate files.
* The translation process no longer creates short ids for message strings. From now, the source code will not be changed by the translation process, translations for the main language will be added to the bundle(s) and translations for other languages will be outputted to separate executable Javascript files.

### Features

* Introduced support for plural translation forms. Closes [ckeditor/ckeditor5#6526](https://github.com/ckeditor/ckeditor5/issues/6526). Closes [ckeditor/ckeditor5#988](https://github.com/ckeditor/ckeditor5/issues/988). ([305590e](https://github.com/ckeditor/ckeditor5-dev/commit/305590e))


## [12.0.9](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.8...@ckeditor/ckeditor5-dev-utils@12.0.9) (2020-02-26)

Internal changes only (updated dependencies, documentation, etc.).


## [12.0.8](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.7...@ckeditor/ckeditor5-dev-utils@12.0.8) (2020-02-14)

### Bug fixes

* Fixed handling of the " character in translation messages and contexts. Closes [#523](https://github.com/ckeditor/ckeditor5-dev/issues/523). ([1d2da09](https://github.com/ckeditor/ckeditor5-dev/commit/1d2da09))


## [12.0.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.6...@ckeditor/ckeditor5-dev-utils@12.0.7) (2020-01-27)

### Bug fixes

* Switched to a fork of JSDoc with version 3.4.3 patched to be compatible with NodeJS 12. Also, bumped chalk library to fix thrown error. Closes [#525](https://github.com/ckeditor/ckeditor5-dev/issues/525). ([a7599ba](https://github.com/ckeditor/ckeditor5-dev/commit/a7599ba))


## [12.0.6](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.5...@ckeditor/ckeditor5-dev-utils@12.0.6) (2020-01-09)

Internal changes only (updated dependencies, documentation, etc.).


## [12.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.4...@ckeditor/ckeditor5-dev-utils@12.0.5) (2019-08-12)

Internal changes only (updated dependencies, documentation, etc.).


## [12.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.3...@ckeditor/ckeditor5-dev-utils@12.0.4) (2019-08-12)

Internal changes only (updated dependencies, documentation, etc.).


## [12.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.2...@ckeditor/ckeditor5-dev-utils@12.0.3) (2019-07-23)

### Bug fixes

* Added ECMA version to `acorn` parser options. Closes [#534](https://github.com/ckeditor/ckeditor5-dev/issues/534). ([0a1fbec](https://github.com/ckeditor/ckeditor5-dev/commit/0a1fbec))


## [12.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.1...@ckeditor/ckeditor5-dev-utils@12.0.2) (2019-07-15)

### Other changes

* Upgraded dependencies for most of the packages. Merged Lerna + Yarn and they can work together now. Closes [#527](https://github.com/ckeditor/ckeditor5-dev/issues/527). Closes [#466](https://github.com/ckeditor/ckeditor5-dev/issues/466). ([dcc3215](https://github.com/ckeditor/ckeditor5-dev/commit/dcc3215))


## [12.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@12.0.0...@ckeditor/ckeditor5-dev-utils@12.0.1) (2019-02-28)

Internal changes only (updated dependencies, documentation, etc.).


## [12.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@11.0.2...@ckeditor/ckeditor5-dev-utils@12.0.0) (2019-02-19)

### BREAKING CHANGES

* Upgraded minimal versions of Node to `8.0.0` and npm to `5.7.1`. See: [ckeditor/ckeditor5#1507](https://github.com/ckeditor/ckeditor5/issues/1507). ([612ea3c](https://github.com/ckeditor/ckeditor5-cloud-services/commit/612ea3c))


## [11.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@11.0.1...@ckeditor/ckeditor5-dev-utils@11.0.2) (2019-02-12)

Internal changes only (updated dependencies, documentation, etc.).


## [11.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@11.0.0...@ckeditor/ckeditor5-dev-utils@11.0.1) (2018-09-24)

Internal changes only (updated dependencies, documentation, etc.).


## [11.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@10.0.3...@ckeditor/ckeditor5-dev-utils@11.0.0) (2018-08-23)

Updated required Node.js version to `>=6.9.0`.


## [10.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@10.0.2...@ckeditor/ckeditor5-dev-utils@10.0.3) (2018-07-17)

Internal changes only (updated dependencies, documentation, etc.).


## [10.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@10.0.1...@ckeditor/ckeditor5-dev-utils@10.0.2) (2018-07-17)

Internal changes only (updated dependencies, documentation, etc.).


## [10.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@10.0.0...@ckeditor/ckeditor5-dev-utils@10.0.1) (2018-07-12)

### Bug fixes

* Fixed compatiblity with `mini-css-extract-plugin` `extract-text-webpack-plugin`. Closes [#425](https://github.com/ckeditor/ckeditor5-dev/issues/425). Thanks to [agentschmitt](https://github.com/agentschmitt)! ([a235742](https://github.com/ckeditor/ckeditor5-dev/commit/a235742))


## [10.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@9.0.1...@ckeditor/ckeditor5-dev-utils@10.0.0) (2018-07-05)

### Other changes

* Updated `CKEditorWebpackPlugin` and related tools to support `webpack@4`. Closes [#371](https://github.com/ckeditor/ckeditor5-dev/issues/371). ([d0cbbca](https://github.com/ckeditor/ckeditor5-dev/commit/d0cbbca))

### BREAKING CHANGES

* This package requires `webpack@4`.


## [9.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@9.0.0...@ckeditor/ckeditor5-dev-utils@9.0.1) (2018-06-20)

### Bug fixes

* CSS `@keyframes` should not be minified by cssnano to prevent naming collisions. Closes [#350](https://github.com/ckeditor/ckeditor5-dev/issues/350). ([8483615](https://github.com/ckeditor/ckeditor5-dev/commit/8483615))
* Deep CSS imports should be observed by the Webpack watcher. Closes [#359](https://github.com/ckeditor/ckeditor5-dev/issues/359). ([3e4aa8a](https://github.com/ckeditor/ckeditor5-dev/commit/3e4aa8a))


## [9.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@8.0.0...@ckeditor/ckeditor5-dev-utils@9.0.0) (2018-04-25)

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([e392d7d](https://github.com/ckeditor/ckeditor5-dev/commit/e392d7d))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [8.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@7.0.7...@ckeditor/ckeditor5-dev-utils@8.0.0) (2018-04-10)

### Bug fixes

* Enabled builds to work with RequireJS. Closes [ckeditor/ckeditor5#914](https://github.com/ckeditor/ckeditor5/issues/914). ([6c69057](https://github.com/ckeditor/ckeditor5-dev/commit/6c69057))

### BREAKING CHANGES

* Due to a new format of translation snippets the new version of `CKEditor5WebpackPlugin` will only be compatible with CKEditor 5 v1.0.0-beta.2 or later.


## [7.0.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@7.0.6...@ckeditor/ckeditor5-dev-utils@7.0.7) (2018-03-27)

Internal changes only (updated dependencies, documentation, etc.).


## [7.0.6](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@7.0.5...@ckeditor/ckeditor5-dev-utils@7.0.6) (2018-03-22)

### Bug fixes

* Theme importer should work when CKEditor 5's development repository or one of its builds is located in a path which contains a `ckeditor5-` fragment. Closes [#351](https://github.com/ckeditor/ckeditor5-dev/issues/351). Closes [#381](https://github.com/ckeditor/ckeditor5-dev/issues/381). ([ec82d7a](https://github.com/ckeditor/ckeditor5-dev/commit/ec82d7a))


## [7.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@7.0.4...@ckeditor/ckeditor5-dev-utils@7.0.5) (2018-03-15)

### Bug fixes

* Added missing dependency. ([f92ae28](https://github.com/ckeditor/ckeditor5-dev/commit/f92ae28))


## [7.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@7.0.3...@ckeditor/ckeditor5-dev-utils@7.0.4) (2018-01-22)

Internal changes only (updated dependencies, documentation, etc.).


## [7.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@7.0.2...@ckeditor/ckeditor5-dev-utils@7.0.3) (2017-12-20)

### Bug fixes

* Added language directory cleaning before each webpack build. Closes [ckeditor/ckeditor5#700](https://github.com/ckeditor/ckeditor5/issues/700). ([07a22cf](https://github.com/ckeditor/ckeditor5-dev/commit/07a22cf))
* Changed invalid regexp on Windows environments for importing themes (PostCSS). Closes [#343](https://github.com/ckeditor/ckeditor5-dev/issues/343). ([4bf9443](https://github.com/ckeditor/ckeditor5-dev/commit/4bf9443))

### Other changes

* Reverted original escodegen package. Closes [#337](https://github.com/ckeditor/ckeditor5-dev/issues/337). ([6bfae99](https://github.com/ckeditor/ckeditor5-dev/commit/6bfae99))


## [7.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@7.0.1...@ckeditor/ckeditor5-dev-utils@7.0.2) (2017-12-01)

Internal changes only (updated dependencies, documentation, etc.).


## [7.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@7.0.0...@ckeditor/ckeditor5-dev-utils@7.0.1) (2017-12-01)

### Bug fixes

* Theme importer PostCSS plugin should not throw when processing styles when building a documentation. ([c9fcf66](https://github.com/ckeditor/ckeditor5-dev/commit/c9fcf66))


## [7.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@6.0.0...@ckeditor/ckeditor5-dev-utils@7.0.0) (2017-11-30)

### Features

* Added support for multiple themes in output builds. Migrated various utilities from SASS to PostCSS. Closes [#321](https://github.com/ckeditor/ckeditor5-dev/issues/321). ([908e3af](https://github.com/ckeditor/ckeditor5-dev/commit/908e3af))


## [6.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-utils@5.0.0...@ckeditor/ckeditor5-dev-utils@6.0.0) (2017-11-30)

### Features

* `TranslationService` v2. Closes [ckeditor/ckeditor5#666](https://github.com/ckeditor/ckeditor5/issues/666). Closes [ckeditor/ckeditor5#624](https://github.com/ckeditor/ckeditor5/issues/624). ([ee2a1d2](https://github.com/ckeditor/ckeditor5-dev/commit/ee2a1d2))


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
