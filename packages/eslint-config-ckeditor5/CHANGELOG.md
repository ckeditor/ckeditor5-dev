Changelog
=========

## [2.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@2.0.1...eslint-config-ckeditor5@2.1.0) (2020-02-26)

### Features

* Add "eslint-plugin-mocha" rules to the default ESLint configuration and configure `dangling-coma` rule. Closes [#481](https://github.com/ckeditor/ckeditor5-dev/issues/481). Closes [ckeditor/ckeditor5#6246](https://github.com/ckeditor/ckeditor5/issues/6246). ([0bd390a](https://github.com/ckeditor/ckeditor5-dev/commit/0bd390a))


## [2.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@2.0.0...eslint-config-ckeditor5@2.0.1) (2020-01-09)

Internal changes only (updated dependencies, documentation, etc.).


## [2.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.14...eslint-config-ckeditor5@2.0.0) (2019-07-09)

### Other changes

* Updated `ecmaVersion` from `es6` to `es2018` (`es9`).
* Changed the `space-before-function-paren` rule to preserve spaces before async arrow functions. Closes [#521](https://github.com/ckeditor/ckeditor5-dev/issues/521).

### BREAKING CHANGES

* The `space-before-function-paren` option was changed to make spaces before async arrow functions required.


## [1.0.14](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.12...eslint-config-ckeditor5@1.0.14) (2019-04-04)

Internal changes only (updated dependencies, documentation, etc.).


## [1.0.12](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.9...eslint-config-ckeditor5@1.0.12) (2019-03-28)

### Features

* Rewrote a script that prepares the testing environment on CI. Now it creates a ckeditor5-like project that contains a proper version of all dependencies. Closes [#471](https://github.com/ckeditor/ckeditor5-dev/issues/471). ([a491c7f](https://github.com/ckeditor/ckeditor5-dev/commit/a491c7f))


## [1.0.9](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.7...eslint-config-ckeditor5@1.0.9) (2018-12-19)

Internal changes only (updated dependencies, documentation, etc.).


## [1.0.7](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.5...eslint-config-ckeditor5@1.0.7) (2017-12-01)

### Bug fixes

* We should require space after words like `new`, `typeof` or `delete`. ([97266f2](https://github.com/ckeditor/ckeditor5-dev/commit/97266f2))


## [1.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.4...eslint-config-ckeditor5@1.0.5) (2017-05-17)

* Aligned spacing around stars. Now, for real. Closes [#204](https://github.com/ckeditor/ckeditor5-dev/issues/204). ([3afdc90](https://github.com/ckeditor/ckeditor5-dev/commit/3afdc90))


## [1.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.3...eslint-config-ckeditor5@1.0.4) (2017-05-17)

* Aligned star spacing to our rules. ([8f143c6](https://github.com/ckeditor/ckeditor5-dev/commit/8f143c6))


## [1.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.2...eslint-config-ckeditor5@1.0.3) (2017-05-16)

### Bug fixes

* Improved `prefer-const` configuration to not throw when reading before assignining. ([91fe66e](https://github.com/ckeditor/ckeditor5-dev/commit/91fe66e))


## [1.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.1...eslint-config-ckeditor5@1.0.2) (2017-05-16)

### Bug fixes

* Disabled `no-confusing-arrow` because it's too pedantic and improved `prefer-const` configuration. ([a3734bf](https://github.com/ckeditor/ckeditor5-dev/commit/a3734bf))


## [1.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/eslint-config-ckeditor5@1.0.0...eslint-config-ckeditor5@1.0.1) (2017-05-16)

### Bug fixes

* Added ESLint as a peer dependency. ([5b1e9d0](https://github.com/ckeditor/ckeditor5-dev/commit/5b1e9d0))


## 1.0.0 (2017-05-16)

Initial version.
