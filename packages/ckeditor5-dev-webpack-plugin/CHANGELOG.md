Changelog
=========

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
