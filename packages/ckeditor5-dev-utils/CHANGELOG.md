Changelog
=========

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
