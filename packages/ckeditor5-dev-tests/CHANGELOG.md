Changelog
=========

## [16.7.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.7.1...@ckeditor/ckeditor5-dev-tests@16.7.2) (2019-09-09)

### Other changes

* Adjusted dev tools to work with "ckeditor-" prefix. See [ckeditor/ckeditor5#924](https://github.com/ckeditor/ckeditor5/issues/924). ([75b226f](https://github.com/ckeditor/ckeditor5-dev/commit/75b226f))


## [16.7.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.7.0...@ckeditor/ckeditor5-dev-tests@16.7.1) (2019-08-14)

Internal changes only (updated dependencies, documentation, etc.).


## [16.7.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.6.0...@ckeditor/ckeditor5-dev-tests@16.7.0) (2019-08-12)

### Features

* Added support for debugging flags in automated and manual tests available via the `--debug` (`-d`) flag. Closes [ckeditor/ckeditor5#383](https://github.com/ckeditor/ckeditor5/issues/383). ([e55c8c2](https://github.com/ckeditor/ckeditor5-dev/commit/e55c8c2))


## [16.6.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.5.0...@ckeditor/ckeditor5-dev-tests@16.6.0) (2019-08-09)

### Features

* Enabled automated test remote debugging in Chrome (Karma). Closes [#544](https://github.com/ckeditor/ckeditor5-dev/issues/544). ([4e18f95](https://github.com/ckeditor/ckeditor5-dev/commit/4e18f95))

### Bug fixes

* Forked repositories should be cloned properly on CI. Closes [#542](https://github.com/ckeditor/ckeditor5-dev/issues/542). ([84444de](https://github.com/ckeditor/ckeditor5-dev/commit/84444de))


## [16.5.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.4.2...@ckeditor/ckeditor5-dev-tests@16.5.0) (2019-08-09)

### Features

* Added a proxy for static assets resources. Closes [#139](https://github.com/ckeditor/ckeditor5-dev/issues/139). ([5a47226](https://github.com/ckeditor/ckeditor5-dev/commit/5a47226))


## [16.4.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.4.1...@ckeditor/ckeditor5-dev-tests@16.4.2) (2019-07-23)

### Other changes

* Adjusted repository, documentation and scripts to changes done in mgit/mrgit. See: [cksource/mgit2#85](https://github.com/cksource/mgit2/issues/85). ([8b4d08d](https://github.com/ckeditor/ckeditor5-dev/commit/8b4d08d))


## [16.4.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.4.0...@ckeditor/ckeditor5-dev-tests@16.4.1) (2019-07-15)

### Other changes

* Upgraded dependencies for most of the packages. Merged Lerna + Yarn and they can work together now. Closes [#527](https://github.com/ckeditor/ckeditor5-dev/issues/527). Closes [#466](https://github.com/ckeditor/ckeditor5-dev/issues/466). ([dcc3215](https://github.com/ckeditor/ckeditor5-dev/commit/dcc3215))


## [16.4.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.3.0...@ckeditor/ckeditor5-dev-tests@16.4.0) (2019-07-09)

### Features

* Enabled `CKEditorWebpackPlugin` in `getWebpackConfigForManualTests()`. Allowed configuring `language` and `additionalLanguages`. Closes [#529](https://github.com/ckeditor/ckeditor5-dev/issues/529).

### Other changes

* Removed the BrowserStack integration from `ckeditor5-dev` repository. See [ckeditor/ckeditor5#1742](https://github.com/ckeditor/ckeditor5/issues/1742). ([a753590](https://github.com/ckeditor/ckeditor5-dev/commit/a753590))


## [16.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.2.3...@ckeditor/ckeditor5-dev-tests@16.3.0) (2019-04-17)

### Features

* Moved script for sending Slack notifications from the main repository. Closes [ckeditor/ckeditor5#1655](https://github.com/ckeditor/ckeditor5/issues/1655). ([3f00d26](https://github.com/ckeditor/ckeditor5-dev/commit/3f00d26))

### Other changes

* Introduced support for CSS files in `depcheck`. See [ckeditor/ckeditor5#1662](https://github.com/ckeditor/ckeditor5/issues/1662). ([55f2e98](https://github.com/ckeditor/ckeditor5-dev/commit/55f2e98))
* Upgraded a version of Safari. Closes [#517](https://github.com/ckeditor/ckeditor5-dev/issues/517). ([eeb5819](https://github.com/ckeditor/ckeditor5-dev/commit/eeb5819))


## [16.2.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.2.2...@ckeditor/ckeditor5-dev-tests@16.2.3) (2019-04-12)

### Bug fixes

* Fixed code coverage matching for Windows. Closes [#509](https://github.com/ckeditor/ckeditor5-dev/issues/509). ([4ac75cc](https://github.com/ckeditor/ckeditor5-dev/commit/4ac75cc))
* Fixed issues related to a new dependency checker on Travis. Closes [ckeditor/ckeditor5#1662](https://github.com/ckeditor/ckeditor5/issues/1662). ([dfc9477](https://github.com/ckeditor/ckeditor5-dev/commit/dfc9477))
* List with dependency issues will be displayed in a more readable way. Closes [#512](https://github.com/ckeditor/ckeditor5-dev/issues/512). ([8a62270](https://github.com/ckeditor/ckeditor5-dev/commit/8a62270))


## [16.2.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.2.1...@ckeditor/ckeditor5-dev-tests@16.2.2) (2019-04-04)

Internal changes only (updated dependencies, documentation, etc.).


## [16.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.2.0...@ckeditor/ckeditor5-dev-tests@16.2.1) (2019-03-28)

### Other changes

* Support for the "depcheckIgnore" key in "package.json" which defines a list of packages that should be ignored during dependency checking. ([9f5e037](https://github.com/ckeditor/ckeditor5-dev/commit/9f5e037))


## [16.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.1.0...@ckeditor/ckeditor5-dev-tests@16.2.0) (2019-03-28)

### Features

* Improved the script which checks dependencies on CI. Added two new informations – which dependencies and devDependencies are unused in the package. The entire script response is now displayed in a table. Closes [#392](https://github.com/ckeditor/ckeditor5-dev/issues/392). ([1642316](https://github.com/ckeditor/ckeditor5-dev/commit/1642316))

### Bug fixes

* Editor Inspector in manual tests should not crash when `window.editor` is set `null`. Closes [#502](https://github.com/ckeditor/ckeditor5-dev/issues/502). ([7ca8762](https://github.com/ckeditor/ckeditor5-dev/commit/7ca8762))


## [16.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.0.1...@ckeditor/ckeditor5-dev-tests@16.1.0) (2019-02-28)

### Features

* Enabled ckeditor5-inspector in all manual tests. Closes [#489](https://github.com/ckeditor/ckeditor5-dev/issues/489). ([1b3f781](https://github.com/ckeditor/ckeditor5-dev/commit/1b3f781))


## [16.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@16.0.0...@ckeditor/ckeditor5-dev-tests@16.0.1) (2019-02-28)

### Bug fixes

* Pull requests builds will use proper commit SHA-1. Closes [#484](https://github.com/ckeditor/ckeditor5-dev/issues/484). ([39740c7](https://github.com/ckeditor/ckeditor5-dev/commit/39740c7))

  Instead of testing the merge commit which does not exist in the git tree, it will use the latest commit from a branch that a user wants to merge.


## [16.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@15.2.0...@ckeditor/ckeditor5-dev-tests@16.0.0) (2019-02-19)

### Features

* Rewrote a script that prepares the testing environment on CI. Now it creates a ckeditor5-like project that contains a proper version of all dependencies. Closes [#471](https://github.com/ckeditor/ckeditor5-dev/issues/471). ([a491c7f](https://github.com/ckeditor/ckeditor5-dev/commit/a491c7f))

### BREAKING CHANGES

* Upgraded minimal versions of Node to `8.0.0` and npm to `5.7.1`. See: [ckeditor/ckeditor5#1507](https://github.com/ckeditor/ckeditor5/issues/1507). ([612ea3c](https://github.com/ckeditor/ckeditor5-cloud-services/commit/612ea3c))


## [15.2.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@15.1.0...@ckeditor/ckeditor5-dev-tests@15.2.0) (2019-02-12)

### Other changes

* Enabled Content Security Policy settings in all manual tests (see [[ckeditor/ckeditor5#335](https://github.com/ckeditor/ckeditor5/issues/335)](https://github.com/ckeditor/ckeditor5/issues/335)). ([3b417c7](https://github.com/ckeditor/ckeditor5-dev/commit/3b417c7))


## [15.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@15.0.3...@ckeditor/ckeditor5-dev-tests@15.1.0) (2019-01-17)

### Other changes

* Added the `'--js-flags="--expose-gc"'` flag to Karma Chrome launcher configuration. See [ckeditor/ckeditor5#1341](https://github.com/ckeditor/ckeditor5/issues/1341). ([f2c0d05](https://github.com/ckeditor/ckeditor5-dev/commit/f2c0d05))


## [15.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@15.0.2...@ckeditor/ckeditor5-dev-tests@15.0.3) (2019-01-14)

### Bug fixes

* Link package inside its node_module's directory for tests. Closes [#470](https://github.com/ckeditor/ckeditor5-dev/issues/470). ([06dbb9f](https://github.com/ckeditor/ckeditor5-dev/commit/06dbb9f))


## [15.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@15.0.1...@ckeditor/ckeditor5-dev-tests@15.0.2) (2019-01-14)

### Bug fixes

* The main repository should be added to yarn workspaces. Closes [ckeditor/ckeditor5-paragraph#39](https://github.com/ckeditor/ckeditor5-paragraph/issues/39). ([6a96700](https://github.com/ckeditor/ckeditor5-dev/commit/6a96700))


## [15.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@15.0.0...@ckeditor/ckeditor5-dev-tests@15.0.1) (2019-01-11)

### Bug fixes

* Forgot to bump mgit2 itself. ([3f7a2b9](https://github.com/ckeditor/ckeditor5-dev/commit/3f7a2b9))


## [15.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@14.1.0...@ckeditor/ckeditor5-dev-tests@15.0.0) (2019-01-11)

### Other changes

* Compatibility with `mgit2@0.10.0`. See [cksource/mgit2#82](https://github.com/cksource/mgit2/issues/82). ([b263242](https://github.com/ckeditor/ckeditor5-dev/commit/b263242))


## [14.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@14.0.0...@ckeditor/ckeditor5-dev-tests@14.1.0) (2019-01-10)

### Other changes

* Compatibility with Node 10. ([9e47285](https://github.com/ckeditor/ckeditor5-dev/commit/9e47285))


## [14.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@13.1.2...@ckeditor/ckeditor5-dev-tests@14.0.0) (2019-01-10)

### Other changes

* Changed scripts in the `@ckeditor/ckeditor5-dev-tests` package after switching development environment to Yarn. See [ckeditor/ckeditor5#1214](https://github.com/ckeditor/ckeditor5/issues/1214). ([18b0dd0](https://github.com/ckeditor/ckeditor5-dev/commit/18b0dd0))


## [13.1.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@13.1.1...@ckeditor/ckeditor5-dev-tests@13.1.2) (2018-12-19)

### Other changes

* Enforce Edge 17 in BrowserStack tests. ([56ae7d3](https://github.com/ckeditor/ckeditor5-dev/commit/56ae7d3))


## [13.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@13.1.0...@ckeditor/ckeditor5-dev-tests@13.1.1) (2018-11-22)

Internal changes only (updated dependencies, documentation, etc.).


## [13.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@13.0.3...@ckeditor/ckeditor5-dev-tests@13.1.0) (2018-11-05)

### Features

* Added meta "viewport" to the manual test template to make testing on mobiles easier. Closes [#450](https://github.com/ckeditor/ckeditor5-dev/issues/450). ([fa96dac](https://github.com/ckeditor/ckeditor5-dev/commit/fa96dac))

### Other changes

* The `.rtf` files are now loaded via `raw-loader`. Closes [#448](https://github.com/ckeditor/ckeditor5-dev/issues/448). ([769cec0](https://github.com/ckeditor/ckeditor5-dev/commit/769cec0))


## [13.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@13.0.2...@ckeditor/ckeditor5-dev-tests@13.0.3) (2018-10-02)

Internal changes only (updated dependencies, documentation, etc.).


## [13.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@13.0.1...@ckeditor/ckeditor5-dev-tests@13.0.2) (2018-09-24)

Internal changes only (updated dependencies, documentation, etc.).


## [13.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@13.0.0...@ckeditor/ckeditor5-dev-tests@13.0.1) (2018-09-14)

### Bug fixes

* Disabled "save-revision" script for pull requests builds. Closes [#434](https://github.com/ckeditor/ckeditor5-dev/issues/434). ([d02b04a](https://github.com/ckeditor/ckeditor5-dev/commit/d02b04a))


## [13.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@12.1.3...@ckeditor/ckeditor5-dev-tests@13.0.0) (2018-08-23)

Updated required Node.js version to `>=6.9.0`.


## [12.1.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@12.1.2...@ckeditor/ckeditor5-dev-tests@12.1.3) (2018-08-23)

Internal changes only (updated dependencies, documentation, etc.).


## [12.1.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@12.1.1...@ckeditor/ckeditor5-dev-tests@12.1.2) (2018-07-17)

Internal changes only (updated dependencies, documentation, etc.).


## [12.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@12.1.0...@ckeditor/ckeditor5-dev-tests@12.1.1) (2018-07-17)

Internal changes only (updated dependencies, documentation, etc.).


## [12.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@12.0.0...@ckeditor/ckeditor5-dev-tests@12.1.0) (2018-07-12)

### Features

* Grouped manual tests in the list. Slightly redesigned the manual test index. Closes [#422](https://github.com/ckeditor/ckeditor5-dev/issues/422). ([9744296](https://github.com/ckeditor/ckeditor5-dev/commit/9744296))


## [12.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@11.0.3...@ckeditor/ckeditor5-dev-tests@12.0.0) (2018-07-05)

### Other changes

* Updated `CKEditorWebpackPlugin` and related tools to support `webpack@4`. Closes [#371](https://github.com/ckeditor/ckeditor5-dev/issues/371). ([d0cbbca](https://github.com/ckeditor/ckeditor5-dev/commit/d0cbbca))

### BREAKING CHANGES

* This package requires `webpack@4`.


## [11.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@11.0.2...@ckeditor/ckeditor5-dev-tests@11.0.3) (2018-06-28)

### Bug fixes

* The Script for saving revisions will correctly and fully synchronise `master-revisions` with `master`. Closes [#375](https://github.com/ckeditor/ckeditor5-dev/issues/375). ([9009c12](https://github.com/ckeditor/ckeditor5-dev/commit/9009c12))


## [11.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@11.0.1...@ckeditor/ckeditor5-dev-tests@11.0.2) (2018-06-20)

Internal changes only (updated dependencies, documentation, etc.).


## [11.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@11.0.0...@ckeditor/ckeditor5-dev-tests@11.0.1) (2018-05-04)

### Bug fixes

* Browsers that require BrowserStack service will not be used in PRs that come from the community. Closes [#402](https://github.com/ckeditor/ckeditor5-dev/issues/402). ([f416819](https://github.com/ckeditor/ckeditor5-dev/commit/f416819))


## [11.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.3.5...@ckeditor/ckeditor5-dev-tests@11.0.0) (2018-04-25)

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([e392d7d](https://github.com/ckeditor/ckeditor5-dev/commit/e392d7d))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [10.3.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.3.3...@ckeditor/ckeditor5-dev-tests@10.3.5) (2018-04-11)

Internal changes only (updated dependencies, documentation, etc.).


## [10.3.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.3.2...@ckeditor/ckeditor5-dev-tests@10.3.3) (2018-03-27)

Internal changes only (updated dependencies, documentation, etc.).


## [10.3.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.3.0...@ckeditor/ckeditor5-dev-tests@10.3.2) (2018-03-22)

### Bug fixes

* Manual tests server should work when CKEditor 5's development repository is located in a path which contains `ckeditor5-` fragment. Closes [#351](https://github.com/ckeditor/ckeditor5-dev/issues/351). Closes [#381](https://github.com/ckeditor/ckeditor5-dev/issues/381). ([ec82d7a](https://github.com/ckeditor/ckeditor5-dev/commit/ec82d7a))


## [10.3.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.2.3...@ckeditor/ckeditor5-dev-tests@10.3.0) (2018-02-21)

### Features

* Implemented a responsive manual test layout with a 'back' button. Improved readability of the sidebar. Closes [#369](https://github.com/ckeditor/ckeditor5-dev/issues/369). ([edf9e15](https://github.com/ckeditor/ckeditor5-dev/commit/edf9e15))


## [10.2.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.2.1...@ckeditor/ckeditor5-dev-tests@10.2.3) (2018-02-13)

### Bug fixes

* BrowserStack will be disabled for PR builds that come from the community. Closes [#358](https://github.com/ckeditor/ckeditor5-dev/issues/358). ([b4f98ac](https://github.com/ckeditor/ckeditor5-dev/commit/b4f98ac))


## [10.2.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-tests@10.2.0...@ckeditor/ckeditor5-dev-tests@10.2.1) (2018-01-22)

Internal changes only (updated dependencies, documentation, etc.).


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
