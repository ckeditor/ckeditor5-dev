Changelog
=========

## [14.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@14.0.1...@ckeditor/ckeditor5-dev-env@14.1.0) (2019-03-28)

### Features

* Multiple "Updated translations." commits will be merged into a single entry in the changelog. Closes [#486](https://github.com/ckeditor/ckeditor5-dev/issues/486). ([1479e67](https://github.com/ckeditor/ckeditor5-dev/commit/1479e67))

### Bug fixes

* Fixed generating changelog for non-scoped packages. Closes [#331](https://github.com/ckeditor/ckeditor5-dev/issues/331). ([a365f08](https://github.com/ckeditor/ckeditor5-dev/commit/a365f08))
* Made all commits display properly during generating the changelog. Closes [#488](https://github.com/ckeditor/ckeditor5-dev/issues/488). ([fa9ae30](https://github.com/ckeditor/ckeditor5-dev/commit/fa9ae30))
* Merge 'stable' branch commit will be ignored during generating the changelog. Closes [#487](https://github.com/ckeditor/ckeditor5-dev/issues/487). ([7a401ef](https://github.com/ckeditor/ckeditor5-dev/commit/7a401ef))


## [14.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@14.0.0...@ckeditor/ckeditor5-dev-env@14.0.1) (2019-02-28)

Internal changes only (updated dependencies, documentation, etc.).


## [14.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@13.0.3...@ckeditor/ckeditor5-dev-env@14.0.0) (2019-02-19)

### BREAKING CHANGES

* Upgraded minimal versions of Node to `8.0.0` and npm to `5.7.1`. See: [ckeditor/ckeditor5#1507](https://github.com/ckeditor/ckeditor5/issues/1507). ([612ea3c](https://github.com/ckeditor/ckeditor5-cloud-services/commit/612ea3c))


## [13.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@13.0.2...@ckeditor/ckeditor5-dev-env@13.0.3) (2019-02-12)

Internal changes only (updated dependencies, documentation, etc.).


## [13.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@13.0.1...@ckeditor/ckeditor5-dev-env@13.0.2) (2018-11-22)

### Bug fixes

* Small fixes for the tool that publishes the packages. Closes [#445](https://github.com/ckeditor/ckeditor5-dev/issues/445). Closes [#446](https://github.com/ckeditor/ckeditor5-dev/issues/446). ([c593561](https://github.com/ckeditor/ckeditor5-dev/commit/c593561))

    * For the real release, the tool won't ask about removing ZIP archives that are created when dry run mode is active. See [#445](https://github.com/ckeditor/ckeditor5-dev/issues/445).
    * Publishing a package for the first time on GitHub will work properly. It didn't work because GitHub API returned `Not Found` response and the tool couldn't understand it. See [#446](https://github.com/ckeditor/ckeditor5-dev/issues/446).


## [13.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@13.0.0...@ckeditor/ckeditor5-dev-env@13.0.1) (2018-11-05)

Internal changes only (updated dependencies, documentation, etc.).


## [13.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@12.0.2...@ckeditor/ckeditor5-dev-env@13.0.0) (2018-10-09)

### Features

* Releasing packages has been split from single step to two. Both steps support a `dry-run` mode which allows testing every step of the release process without publishing anything. Closes [#427](https://github.com/ckeditor/ckeditor5-dev/issues/427). ([f00cd31](https://github.com/ckeditor/ckeditor5-dev/commit/f00cd31))

  For tagging repositories use `tasks.bumpVersions()` which updates version across all packages in the project. Before starting the updating process, the task validates whether all ingredients are defined (mostly whether changelogs were generated).

  For publishing changes use `tasks.releaseSubRepositories()` which cares about publishing changes on NPM and/or GitHub. It checks versions of packages published on NPM and GitHub so there is no risk to publish the same changes twice.

  Both tasks contain a dry-run mode which allows testing the whole process without a pain about pushing or publishing. The dry-run mode prints every called command on the screen. Instead of publishing package, it creates an archive that contains content which will be published. All commits made by `npm version` (and its hooks like `pre` or `post`) will be removed.

### Bug fixes

* Fixed invalid key name. ([2413072](https://github.com/ckeditor/ckeditor5-dev/commit/2413072))

### BREAKING CHANGES

* `tasks.releaseSubRepositories()` does not updates versions any more. Use it together with `tasks.bumpVersions()`.
* `cli.configureReleaseOptions()` returns `npm` and `github` keys (and opposite values) instead of `skipNpm` and `skipGithub`

BREAKNG CHANGES: `getSubRepositoriesPaths()` returns an object that contains two keys: `matched` and `skipped`. Was: `packages` and `skipped`.

### NOTE

* `tasks.generateChangelogForSubRepositories()` accepts `skipMainRepository` option which is passed to `getSubRepositoriesPaths()` util. If `skipMainRepository` option is set on true, the package defined in `options.cwd` will be added as `skipped`, if on false, as `matched`.


## [12.0.2](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@12.0.1...@ckeditor/ckeditor5-dev-env@12.0.2) (2018-10-02)

### Bug fixes

* Generated a changelog for the first time will have a proper link (in a header). Closes [#430](https://github.com/ckeditor/ckeditor5-dev/issues/430). ([e68c35b](https://github.com/ckeditor/ckeditor5-dev/commit/e68c35b))


## [12.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@12.0.0...@ckeditor/ckeditor5-dev-env@12.0.1) (2018-09-24)

Internal changes only (updated dependencies, documentation, etc.).


## [12.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@11.1.1...@ckeditor/ckeditor5-dev-env@12.0.0) (2018-08-23)

Updated required Node.js version to `>=6.9.0`.


## [11.1.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@11.1.0...@ckeditor/ckeditor5-dev-env@11.1.1) (2018-07-17)

Internal changes only (updated dependencies, documentation, etc.).


## [11.1.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@11.0.0...@ckeditor/ckeditor5-dev-env@11.1.0) (2018-07-17)

### Features

* The release tool supports updating the `peerDependencies` in `package.json`. Introduced a `dryRun` mode which allows testing the whole release process without publishing anything. The changelog generator for sub-repositories accepts the `newVersion` parameter. All generated changelog will use the version instead of analyzing a history of commits in a given repository. See [ckeditor/ckeditor5#1061](https://github.com/ckeditor/ckeditor5/issues/1061). ([263f37b](https://github.com/ckeditor/ckeditor5-dev/commit/263f37b))

  Dry run mode for release sub-repositories:

    - `npm version` will not create a tag (only the commit will be made),
    - `npm pack` will be called instead of `npm publish` (it packs the whole release to a ZIP archive),
    - `git push` will be replaced with a log on the screen,
    - creating a release on GitHub will be replaced with a log that will contain a URL to the release,
    - every called command will be displayed.


## [11.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@10.0.0...@ckeditor/ckeditor5-dev-env@11.0.0) (2018-07-05)

### Other changes

* Updated `CKEditorWebpackPlugin` and related tools to support `webpack@4`. Closes [#371](https://github.com/ckeditor/ckeditor5-dev/issues/371). ([d0cbbca](https://github.com/ckeditor/ckeditor5-dev/commit/d0cbbca))

### BREAKING CHANGES

* This package requires `webpack@4`.


## [10.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@9.0.3...@ckeditor/ckeditor5-dev-env@10.0.0) (2018-06-28)

### Features

* The changelog generator for a single package (`generateChangelogForSinglePackage()`) will allow hiding a link to compare releases on GitHub and links to particular commits. Closes [#415](https://github.com/ckeditor/ckeditor5-dev/issues/415). ([4d7dc4b](https://github.com/ckeditor/ckeditor5-dev/commit/4d7dc4b))

### BREAKING CHANGES

* An optional parameter `newVersion` for `generateChangelogForSinglePackage()` method has been replaced with an `options` object (of which it is a key).


## [9.0.3](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@9.0.1...@ckeditor/ckeditor5-dev-env@9.0.3) (2018-06-28)

Internal changes only (updated dependencies, documentation, etc.).


## [9.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@9.0.0...@ckeditor/ckeditor5-dev-env@9.0.1) (2018-05-04)

Internal changes only (updated dependencies, documentation, etc.).


## [9.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@8.0.9...@ckeditor/ckeditor5-dev-env@9.0.0) (2018-04-25)

### Bug fixes

* An error that occurs during publishing a package on GitHub will not break the whole process and the rest packages would be published. Closes [#397](https://github.com/ckeditor/ckeditor5-dev/issues/397). ([7f66531](https://github.com/ckeditor/ckeditor5-dev/commit/7f66531))
* The "Dependencies" header will not appear if no dependencies have been added or changed. Also, fixed the invalid spacing between two versions in the generated changelog. Closes [#398](https://github.com/ckeditor/ckeditor5-dev/issues/398). ([77bc394](https://github.com/ckeditor/ckeditor5-dev/commit/77bc394))

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([e392d7d](https://github.com/ckeditor/ckeditor5-dev/commit/e392d7d))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [8.0.9](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@8.0.8...@ckeditor/ckeditor5-dev-env@8.0.9) (2018-04-10)

Internal changes only (updated dependencies, documentation, etc.).


## [8.0.8](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@8.0.7...@ckeditor/ckeditor5-dev-env@8.0.8) (2018-03-27)

### Bug fixes

* An invalid parameter was passed to the logger and it caused that logs were displayed incorrectly. Closes [#380](https://github.com/ckeditor/ckeditor5-dev/issues/380). ([27aaa13](https://github.com/ckeditor/ckeditor5-dev/commit/27aaa13))


## [8.0.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@8.0.5...@ckeditor/ckeditor5-dev-env@8.0.7) (2018-03-22)

Internal changes only (updated dependencies, documentation, etc.).


## [8.0.5](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@8.0.4...@ckeditor/ckeditor5-dev-env@8.0.5) (2018-01-22)

### Bug fixes

* Translation utils will now add correct license headers. ([c054c17](https://github.com/ckeditor/ckeditor5-dev/commit/c054c17))


## [8.0.4](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@8.0.0...@ckeditor/ckeditor5-dev-env@8.0.4) (2017-12-20)

### Bug fixes

* Additional notes will be removed from commit's footer. Closes [#341](https://github.com/ckeditor/ckeditor5-dev/issues/341). ([95bcfd8](https://github.com/ckeditor/ckeditor5-dev/commit/95bcfd8))


## [8.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@7.0.1...@ckeditor/ckeditor5-dev-env@8.0.0) (2017-11-30)

### Features

* `TranslationService` v2. Closes [ckeditor/ckeditor5#666](https://github.com/ckeditor/ckeditor5/issues/666). Closes [ckeditor/ckeditor5#624](https://github.com/ckeditor/ckeditor5/issues/624). ([ee2a1d2](https://github.com/ckeditor/ckeditor5-dev/commit/ee2a1d2))


## [7.0.1](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@7.0.0...@ckeditor/ckeditor5-dev-env@7.0.1) (2017-11-28)

### Bug fixes

* Additional tags for continuous integration services used in commit message will be removed during generating the changelog. Closes [#309](https://github.com/ckeditor/ckeditor5-dev/issues/309). ([600f36e](https://github.com/ckeditor/ckeditor5-dev/commit/600f36e))
* Changelog generator for internal releases will always add two blank lines. Closes [#308](https://github.com/ckeditor/ckeditor5-dev/issues/308). ([b7b5453](https://github.com/ckeditor/ckeditor5-dev/commit/b7b5453))
* Links to releases will be generated correctly. Closes [#310](https://github.com/ckeditor/ckeditor5-dev/issues/310). ([5f98f9e](https://github.com/ckeditor/ckeditor5-dev/commit/5f98f9e))


## [7.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@6.0.0...@ckeditor/ckeditor5-dev-env@7.0.0) (2017-11-13)

### Other changes

* Removed gulp dependency across the whole project. Closes [#296](https://github.com/ckeditor/ckeditor5-dev/issues/296). ([723bee5](https://github.com/ckeditor/ckeditor5-dev/commit/723bee5))

  Now all packages use only npm scripts. Depending on usage you might either create a `"script"` entry in `pacakge.json` to invoke bin executables or require the library into a script.

  * Package `ckeditor5-dev-env` exposes new `translations` binary.
  * Package `ckeditor5-dev-tests` exposes new `test:manual` binary.
  * Removed `gulp-jsdoc3` from `ckeditor5-dev-docs`. Now `jsdoc` is invoked directly.
  * Removed `options` param from logger methods. Logger no longer uses `gutil.log` method.

### BREAKING CHANGES

* Gulp tasks were removed. New npm scripts were introduced.


## [6.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.13...@ckeditor/ckeditor5-dev-env@6.0.0) (2017-11-10)

### Features

* Introduced a task which allows generating a summary changelog for a repository. Closes [#289](https://github.com/ckeditor/ckeditor5-dev/issues/289). ([eaf76b4](https://github.com/ckeditor/ckeditor5-dev/commit/eaf76b4))

### BREAKING CHANGES

* Release tool won't generate changelogs for skipped packages anymore. This task will be handled by changelog generator.

### NOTE

* The changelog generator will propose `internal` bump version instead of `skip` if a package contains any commit.
* If a package does not contain any commit, the changelog will propose `skip` bump version.
* `internal` bump will increase the release version if the current version is specified as a release (`v1.0.0-alpha.1` becomes `v1.0.0-alpha.2`).


## [5.1.13](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.12...@ckeditor/ckeditor5-dev-env@5.1.13) (2017-10-20)

### Bug fixes

* Changed order of commands executed by the release tool to optimize the time it takes from the first published package to the last. Closes [#272](https://github.com/ckeditor/ckeditor5-dev/issues/272). Closes [#292](https://github.com/ckeditor/ckeditor5-dev/issues/292). ([451ff8c](https://github.com/ckeditor/ckeditor5-dev/commit/451ff8c))

  Due to releasing packages one after another, the builds on CI might break and users' `npm install` commands might fail too. Now release tool will:

  * do all commits (generate missing changelogs or/and  update dependencies' versions),
  * publish all packages on NPM (all packages will contain proper versions),
  * do all pushes (CI will not crash because all versions are valid),
  * make the GitHub releases.

  This will ensure that the process takes minimum amount of time.

### Other changes

* Changed order of headers in generated changelog. Closes [#293](https://github.com/ckeditor/ckeditor5-dev/issues/293). ([ad660b4](https://github.com/ckeditor/ckeditor5-dev/commit/ad660b4))


## [5.1.12](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.10...@ckeditor/ckeditor5-dev-env@5.1.12) (2017-10-01)

### Bug fixes

* If a part of a commit message matches "organization/repository#id" it will be replaced with a link to an issue in that specific repository. Also, scoped package names won't be replaced with links to user profiles. Closes [#269](https://github.com/ckeditor/ckeditor5-dev/issues/269). ([e9bf324](https://github.com/ckeditor/ckeditor5-dev/commit/e9bf324))


## [5.1.10](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.8...@ckeditor/ckeditor5-dev-env@5.1.10) (2017-09-07)

### Bug fixes

* Merge commit which does not contain the second line will not crash the changelog tool. Closes [#276](https://github.com/ckeditor/ckeditor5-dev/issues/276). ([ab1ffd8](https://github.com/ckeditor/ckeditor5-dev/commit/ab1ffd8))
* Several issues related to proper typing the commit subject. Closes [#270](https://github.com/ckeditor/ckeditor5-dev/issues/270). Closes [#271](https://github.com/ckeditor/ckeditor5-dev/issues/271). ([0df891d](https://github.com/ckeditor/ckeditor5-dev/commit/0df891d))

  * If a commit message didn't end with a dot, it was ignored. Now it will be handled.
  * Added aliases for `Fix` type of the commit. Now `Fixes` and `Fixed` will be handled as `Fix`.
  * Merge commit which wasn't a pull request was ignored. Now it will be handled.


## [5.1.8](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.7...@ckeditor/ckeditor5-dev-env@5.1.8) (2017-09-01)

### Bug fixes

* Add better network error handling for downloading and uploading translations. Closes [#265](https://github.com/ckeditor/ckeditor5-dev/issues/265). ([c12fb15](https://github.com/ckeditor/ckeditor5-dev/commit/c12fb15))


## [5.1.7](https://github.com/ckeditor/ckeditor5-dev/compare/@ckeditor/ckeditor5-dev-env@5.1.5...@ckeditor/ckeditor5-dev-env@5.1.7) (2017-08-23)

### Bug fixes

* Fixed Transifex URL scheme. Closes [#249](https://github.com/ckeditor/ckeditor5-dev/issues/249). ([3276048](https://github.com/ckeditor/ckeditor5-dev/commit/3276048))


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
