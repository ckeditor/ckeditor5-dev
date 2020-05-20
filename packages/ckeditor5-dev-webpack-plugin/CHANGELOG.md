Changelog
=========

All changes in the package are documented in the main repository. See: https://github.com/ckeditor/ckeditor5-dev/blob/master/CHANGELOG.md.

Changes for the past releases are available below.

## [9.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@9.0.0...@ckeditor/ckeditor5-dev-webpack-plugin@9.0.2) (2020-05-13)

Internal changes only (updated dependencies, documentation, etc.).


## [9.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@8.0.9...@ckeditor/ckeditor5-dev-webpack-plugin@9.0.0) (2020-04-23)

### BREAKING CHANGES

* Omitting the language property in the `CKEditorWebpackPlugin` will not have any effect from now. This means that in both cases only the main `language` will be added to the main bundle and translations for other languages will be saved in separate files.
* The translation process no longer creates short ids for message strings. From now, the source code will not be changed by the translation process, translations for the main language will be added to the bundle(s) and translations for other languages will be outputted to separate executable Javascript files.

### Features

* Introduced support for plural translation forms. Closes [ckeditor/ckeditor5#6526](https://github.com/ckeditor/ckeditor5/issues/6526). Closes [ckeditor/ckeditor5#988](https://github.com/ckeditor/ckeditor5/issues/988). ([305590e](https://github.com/ckeditor/ckeditor5-dev/commit/305590e))


## [8.0.9](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@8.0.7...@ckeditor/ckeditor5-dev-webpack-plugin@8.0.9) (2020-02-26)

Internal changes only (updated dependencies, documentation, etc.).


## [8.0.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@8.0.6...@ckeditor/ckeditor5-dev-webpack-plugin@8.0.7) (2020-01-27)

### Bug fixes

* Switched to a fork of JSDoc with version 3.4.3 patched to be compatible with NodeJS 12. Also, bumped chalk library to fix thrown error. Closes [#525](https://github.com/ckeditor/ckeditor5-dev/issues/525). ([a7599ba](https://github.com/ckeditor/ckeditor5-dev/commit/a7599ba))


## [8.0.6](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@8.0.1...@ckeditor/ckeditor5-dev-webpack-plugin@8.0.6) (2020-01-09)

Internal changes only (updated dependencies, documentation, etc.).


## [8.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@8.0.0...@ckeditor/ckeditor5-dev-webpack-plugin@8.0.1) (2019-02-28)

Internal changes only (updated dependencies, documentation, etc.).


## [8.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@7.0.2...@ckeditor/ckeditor5-dev-webpack-plugin@8.0.0) (2019-02-19)

### BREAKING CHANGES

* Upgraded minimal versions of Node to `8.0.0` and npm to `5.7.1`. See: [ckeditor/ckeditor5#1507](https://github.com/ckeditor/ckeditor5/issues/1507). ([612ea3c](https://github.com/ckeditor/ckeditor5-cloud-services/commit/612ea3c))


## [7.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@7.0.0...@ckeditor/ckeditor5-dev-webpack-plugin@7.0.2) (2019-02-12)

Internal changes only (updated dependencies, documentation, etc.).


## [7.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@6.0.3...@ckeditor/ckeditor5-dev-webpack-plugin@7.0.0) (2018-08-23)

Updated required Node.js version to `>=6.9.0`.


## [6.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@6.0.2...@ckeditor/ckeditor5-dev-webpack-plugin@6.0.3) (2018-07-17)

Internal changes only (updated dependencies, documentation, etc.).


## [6.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@6.0.0...@ckeditor/ckeditor5-dev-webpack-plugin@6.0.2) (2018-07-17)

Internal changes only (updated dependencies, documentation, etc.).


## [6.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@5.0.0...@ckeditor/ckeditor5-dev-webpack-plugin@6.0.0) (2018-07-05)

### Other changes

* Updated `CKEditorWebpackPlugin` and related tools to support `webpack@4`. Closes [#371](https://github.com/ckeditor/ckeditor5-dev/issues/371). ([d0cbbca](https://github.com/ckeditor/ckeditor5-dev/commit/d0cbbca))

### BREAKING CHANGES

* This package requires `webpack@4`.


## [5.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@4.0.0...@ckeditor/ckeditor5-dev-webpack-plugin@5.0.0) (2018-04-25)

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([e392d7d](https://github.com/ckeditor/ckeditor5-dev/commit/e392d7d))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [4.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@3.0.8...@ckeditor/ckeditor5-dev-webpack-plugin@4.0.0) (2018-04-10)

### Bug fixes

* Enabled builds to work with RequireJS. Closes [ckeditor/ckeditor5#914](https://github.com/ckeditor/ckeditor5/issues/914). ([6c69057](https://github.com/ckeditor/ckeditor5-dev/commit/6c69057))

### BREAKING CHANGES

* Due to a new format of translation snippets the new version of `CKEditor5WebpackPlugin` will only be compatible with CKEditor 5 v1.0.0-beta.2 or later.


## [3.0.8](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@3.0.6...@ckeditor/ckeditor5-dev-webpack-plugin@3.0.8) (2018-03-22)

Internal changes only (updated dependencies, documentation, etc.).


## [3.0.6](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@3.0.5...@ckeditor/ckeditor5-dev-webpack-plugin@3.0.6) (2018-02-08)

### Other changes

* Changed default output directory name for translations. Closes [#354](https://github.com/ckeditor/ckeditor5-dev/issues/354). ([c4ef879](https://github.com/ckeditor/ckeditor5-dev/commit/c4ef879))


## [3.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@3.0.4...@ckeditor/ckeditor5-dev-webpack-plugin@3.0.5) (2018-01-22)

Internal changes only (updated dependencies, documentation, etc.).


## [3.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@3.0.0...@ckeditor/ckeditor5-dev-webpack-plugin@3.0.4) (2017-12-20)

### Bug fixes

* Added language directory cleaning before each webpack build. Closes [ckeditor/ckeditor5#700](https://github.com/ckeditor/ckeditor5/issues/700). ([07a22cf](https://github.com/ckeditor/ckeditor5-dev/commit/07a22cf))


## [3.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@2.0.21...@ckeditor/ckeditor5-dev-webpack-plugin@3.0.0) (2017-11-30)

### Features

* Added support for building multiple languages to `CKEditorWebpackPlugin()`. Closes [ckeditor/ckeditor5#666](https://github.com/ckeditor/ckeditor5/issues/666). Closes [ckeditor/ckeditor5#624](https://github.com/ckeditor/ckeditor5/issues/624). ([ee2a1d2](https://github.com/ckeditor/ckeditor5-dev/commit/ee2a1d2))

### BREAKING CHANGES

* The `CKEditorWebpackPlugin()` plugin now supports `language` and `additionalLanguages` options instead of `languages`. If only `language` is set, the plugin will translate strings directly in the main bundle. When `additionalLanguages` are provided, then the plugin will output a bundle with the main language and rest translation files separately.


## [2.0.21](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@2.0.20...@ckeditor/ckeditor5-dev-webpack-plugin@2.0.21) (2017-11-10)

### Bug fixes

* Made webpack plugin being able to run inside the ckeditor5-* package. Closes [#302](https://github.com/ckeditor/ckeditor5-dev/issues/302). ([78e1d5a](https://github.com/ckeditor/ckeditor5-dev/commit/78e1d5a))


## [2.0.20](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@2.0.19...@ckeditor/ckeditor5-dev-webpack-plugin@2.0.20) (2017-10-20)

### Bug fixes

* Fixed paths in webpack-plugin for Windows environment. Closes [#297](https://github.com/ckeditor/ckeditor5-dev/issues/297). ([7e61a1f](https://github.com/ckeditor/ckeditor5-dev/commit/7e61a1f))


## [2.0.19](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@2.0.13...@ckeditor/ckeditor5-dev-webpack-plugin@2.0.19) (2017-10-01)

Internal changes only (updated dependencies, documentation, etc.).

## [2.0.13](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@2.0.9...@ckeditor/ckeditor5-dev-webpack-plugin@2.0.13) (2017-08-18)

Internal changes only (updated dependencies, documentation, etc.).

## [2.0.9](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@2.0.7...@ckeditor/ckeditor5-dev-webpack-plugin@2.0.9) (2017-05-24)

Internal changes only (updated dependencies, documentation, etc.).

## [2.0.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-webpack-plugin@2.0.6...@ckeditor/ckeditor5-dev-webpack-plugin@2.0.7) (2017-04-27)

Internal changes only (updated dependencies, documentation, etc.).

## 2.0.6

The big bang.
