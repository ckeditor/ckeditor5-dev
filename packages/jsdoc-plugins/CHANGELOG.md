Changelog
=========

## [3.0.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@3.0.6...@ckeditor/jsdoc-plugins@3.0.7) (2019-09-09)

### Other changes

* Adjusted dev tools to work with "ckeditor-" prefix. See [ckeditor/ckeditor5#924](https://github.com/ckeditor/ckeditor5/issues/924). ([75b226f](https://github.com/ckeditor/ckeditor5-dev/commit/75b226f))


## [3.0.6](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@3.0.5...@ckeditor/jsdoc-plugins@3.0.6) (2019-09-02)

### Bug fixes

* JSDoc validator will end with proper exit code if, during the validation, any error occurred. Closes [#550](https://github.com/ckeditor/ckeditor5-dev/issues/550). ([30f02e7](https://github.com/ckeditor/ckeditor5-dev/commit/30f02e7))


## [3.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@3.0.4...@ckeditor/jsdoc-plugins@3.0.5) (2019-08-12)

### Other changes

* The doclet validator is improved. Now, during parameters linting it logs an error if the doclet cannot be a valid type (e.g. a method, property or a mixin cannot be a valid type). It also checks now whether the [@extends](https://github.com/extends) tag points to the valid reference. Closes [#507](https://github.com/ckeditor/ckeditor5-dev/issues/507). ([c5a8b08](https://github.com/ckeditor/ckeditor5-dev/commit/c5a8b08))


## [3.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@3.0.3...@ckeditor/jsdoc-plugins@3.0.4) (2019-08-09)

### Other changes

* Added `ErrorEvent` and `PromiseRejectionEvent` types to the JSDoc validator. Part of [ckeditor/ckeditor5-watchdog#3](https://github.com/ckeditor/ckeditor5-watchdog/issues/3). ([799b272](https://github.com/ckeditor/ckeditor5-dev/commit/799b272))


## [3.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@3.0.2...@ckeditor/jsdoc-plugins@3.0.3) (2019-07-15)

### Other changes

* Upgraded dependencies for most of the packages. Merged Lerna + Yarn and they can work together now. Closes [#527](https://github.com/ckeditor/ckeditor5-dev/issues/527). Closes [#466](https://github.com/ckeditor/ckeditor5-dev/issues/466). ([dcc3215](https://github.com/ckeditor/ckeditor5-dev/commit/dcc3215))


## [3.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@3.0.1...@ckeditor/jsdoc-plugins@3.0.2) (2019-07-09)

### Other changes

* Enabled doclets generation out of typedef properties. Closes [#504](https://github.com/ckeditor/ckeditor5-dev/issues/504). ([2f480d1](https://github.com/ckeditor/ckeditor5-dev/commit/2f480d1))


## [3.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@3.0.0...@ckeditor/jsdoc-plugins@3.0.1) (2019-02-28)

Internal changes only (updated dependencies, documentation, etc.).


## [3.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@2.1.1...@ckeditor/jsdoc-plugins@3.0.0) (2019-02-19)

### Bug fixes

* Fixed inheritance mechanism and filtered out internal doclets. Closes [#465](https://github.com/ckeditor/ckeditor5-dev/issues/465). ([04a147b](https://github.com/ckeditor/ckeditor5-dev/commit/04a147b))

### BREAKING CHANGES

* Upgraded minimal versions of Node to `8.0.0` and npm to `5.7.1`. See: [ckeditor/ckeditor5#1507](https://github.com/ckeditor/ckeditor5/issues/1507). ([612ea3c](https://github.com/ckeditor/ckeditor5-cloud-services/commit/612ea3c))


## [2.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@2.1.0...@ckeditor/jsdoc-plugins@2.1.1) (2019-02-12)

Internal changes only (updated dependencies, documentation, etc.).


## [2.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@2.0.2...@ckeditor/jsdoc-plugins@2.1.0) (2018-10-09)

### Features

* Added missing `@link` part validation to JSDoc validation. Closes [#433](https://github.com/ckeditor/ckeditor5-dev/issues/433). ([41c3014](https://github.com/ckeditor/ckeditor5-dev/commit/41c3014))


## [2.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@2.0.1...@ckeditor/jsdoc-plugins@2.0.2) (2018-10-02)

### Other changes

* Improved performance of the `relation-fixer` plugin by the factor of 10x. Closes [#438](https://github.com/ckeditor/ckeditor5-dev/issues/438). ([ef1dc21](https://github.com/ckeditor/ckeditor5-dev/commit/ef1dc21))


## [2.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@2.0.0...@ckeditor/jsdoc-plugins@2.0.1) (2018-09-24)

Internal changes only (updated dependencies, documentation, etc.).


## [2.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.9.7...@ckeditor/jsdoc-plugins@2.0.0) (2018-08-23)

Updated required Node.js version to `>=6.9.0`.


## [1.9.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.9.6...@ckeditor/jsdoc-plugins@1.9.7) (2018-07-17)

Internal changes only (updated dependencies, documentation, etc.).


## [1.9.6](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.9.5...@ckeditor/jsdoc-plugins@1.9.6) (2018-07-03)

### Other changes

* Added FocusEvent to known types. ([9dd3b90](https://github.com/ckeditor/ckeditor5-dev/commit/9dd3b90))


## [1.9.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.9.4...@ckeditor/jsdoc-plugins@1.9.5) (2018-06-28)

### Other changes

* Added NodeList to known types. ([158f60b](https://github.com/ckeditor/ckeditor5-dev/commit/158f60b))


## [1.9.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.9.3...@ckeditor/jsdoc-plugins@1.9.4) (2018-03-27)

Internal changes only (updated dependencies, documentation, etc.).


## [1.9.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.9.2...@ckeditor/jsdoc-plugins@1.9.3) (2018-02-20)

### Bug fixes

* Improved links detection and validation. Closes [#365](https://github.com/ckeditor/ckeditor5-dev/issues/365). ([00d5b10](https://github.com/ckeditor/ckeditor5-dev/commit/00d5b10))


## [1.9.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.9.1...@ckeditor/jsdoc-plugins@1.9.2) (2018-02-16)

### Bug fixes

* Fixed inheritance in event doclets for observables. Closes [#368](https://github.com/ckeditor/ckeditor5-dev/issues/368). ([3fc1acc](https://github.com/ckeditor/ckeditor5-dev/commit/3fc1acc))


## [1.9.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.9.0...@ckeditor/jsdoc-plugins@1.9.1) (2018-02-12)

### Bug fixes

* Fixed JSDoc relation-fixer plugin to not include interfaces in inheritance hierarchy. Closes [#361](https://github.com/ckeditor/ckeditor5-dev/issues/361). ([e46efbf](https://github.com/ckeditor/ckeditor5-dev/commit/e46efbf) and [d22fd7d](https://github.com/ckeditor/ckeditor5-dev/commit/d22fd7d))


## [1.9.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.8.3...@ckeditor/jsdoc-plugins@1.9.0) (2018-01-22)

### Features

* JSDoc: Added support for using `@extends` with `@typedef`s. Closes [#355](https://github.com/ckeditor/ckeditor5-dev/issues/355). ([a3dd8c5](https://github.com/ckeditor/ckeditor5-dev/commit/a3dd8c5))


## [1.8.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.8.2...@ckeditor/jsdoc-plugins@1.8.3) (2017-11-28)

### Bug fixes

* Improved linting the `memberof` property. Closes [ckeditor/ckeditor5-utils#209](https://github.com/ckeditor/ckeditor5-utils/issues/209). ([b57fe29](https://github.com/ckeditor/ckeditor5-dev/commit/b57fe29))


## [1.8.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.8.1...@ckeditor/jsdoc-plugins@1.8.2) (2017-11-24)

### Bug fixes

* Optimized doclet validator plugin. Closes [#306](https://github.com/ckeditor/ckeditor5-dev/issues/306). ([664fb2d](https://github.com/ckeditor/ckeditor5-dev/commit/664fb2d))
* Optimized Relation Fixer plugin. Closes [#312](https://github.com/ckeditor/ckeditor5-dev/issues/312). ([f575d77](https://github.com/ckeditor/ckeditor5-dev/commit/f575d77))


## [1.8.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.8.0...@ckeditor/jsdoc-plugins@1.8.1) (2017-11-10)

### Bug fixes

* Add access property to events generated from observables. Closes [#300](https://github.com/ckeditor/ckeditor5-dev/issues/300). ([a80fe6e](https://github.com/ckeditor/ckeditor5-dev/commit/a80fe6e))


## [1.8.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.7.1...@ckeditor/jsdoc-plugins@1.8.0) (2017-10-10)

### Features

* Provided support for `@observable` tag. Closes [#285](https://github.com/ckeditor/ckeditor5-dev/issues/285). ([fed57af](https://github.com/ckeditor/ckeditor5-dev/commit/fed57af))


## [1.7.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.7.0...@ckeditor/jsdoc-plugins@1.7.1) (2017-10-01)

Internal changes only (updated dependencies, documentation, etc.).

## [1.7.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.6.1...@ckeditor/jsdoc-plugins@1.7.0) (2017-09-20)

### Features

* Provided `[@error](https://github.com/error)` tag detection in JSDoc. Closes [#280](https://github.com/ckeditor/ckeditor5-dev/issues/280). ([b7a0cf5](https://github.com/ckeditor/ckeditor5-dev/commit/b7a0cf5))


## [1.6.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.6.0...@ckeditor/jsdoc-plugins@1.6.1) (2017-08-23)

### Bug fixes

* Remove duplicates in JSDoc relation-fixer plugin. Closes [#261](https://github.com/ckeditor/ckeditor5-dev/issues/261). ([e2a921a](https://github.com/ckeditor/ckeditor5-dev/commit/e2a921a))


## [1.6.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.5.2...@ckeditor/jsdoc-plugins@1.6.0) (2017-08-18)

### Features

* All events will be automatically extended with `EventInfo` parameter. Closes [#257](https://github.com/ckeditor/ckeditor5-dev/issues/257). ([3968bd0](https://github.com/ckeditor/ckeditor5-dev/commit/3968bd0))


## [1.5.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.5.0...@ckeditor/jsdoc-plugins@1.5.2) (2017-08-16)

### Other changes

* Added Window type to JSDoc validator. Closes [#250](https://github.com/ckeditor/ckeditor5-dev/issues/250). ([fdec4a0](https://github.com/ckeditor/ckeditor5-dev/commit/fdec4a0))


## [1.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.4.0...@ckeditor/jsdoc-plugins@1.5.0) (2017-06-20)

### Features

* Static and mixed method, properties and events will be inherited too. Closes [#226](https://github.com/ckeditor/ckeditor5-dev/issues/226). ([a160840](https://github.com/ckeditor/ckeditor5-dev/commit/a160840))


## [1.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.3.1...@ckeditor/jsdoc-plugins@1.4.0) (2017-05-29)

### Features

* Allow breaking the process if API docs validation fails. Closes [#221](https://github.com/ckeditor/ckeditor5-dev/issues/221). ([e2f0dec](https://github.com/ckeditor/ckeditor5-dev/commit/e2f0dec))


## [1.3.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.3.0...@ckeditor/jsdoc-plugins@1.3.1) (2017-05-24)

Internal changes only (updated dependencies, documentation, etc.).

## [1.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.2.1...@ckeditor/jsdoc-plugins@1.3.0) (2017-05-18)

### Features

* Introduced JSDoc plugin enabling inheritance of static members. Closes [#201](https://github.com/ckeditor/ckeditor5-dev/issues/201). ([08c0a21](https://github.com/ckeditor/ckeditor5-dev/commit/08c0a21))


## [1.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/jsdoc-plugins@1.2.0...@ckeditor/jsdoc-plugins@1.2.1) (2017-04-27)

Internal changes only (updated dependencies, documentation, etc.).


## 1.2.0

The big bang.
