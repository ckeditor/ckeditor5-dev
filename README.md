CKEditor 5 development tools packages
=====================================

[![Build Status](https://travis-ci.com/ckeditor/ckeditor5-dev.svg?branch=master)](https://app.travis-ci.com/github/ckeditor/ckeditor5-dev)
[![Coverage Status](https://coveralls.io/repos/github/ckeditor/ckeditor5-dev/badge.svg?branch=master)](https://coveralls.io/github/ckeditor/ckeditor5-dev?branch=master)

## Packages

This repository is a monorepo. It contains multiple npm packages.

| Package                                                                                    | Version                                                                                                                                                             | Dependencies                                                                                                |
|--------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| [`@ckeditor/ckeditor5-dev-bump-year`](/packages/ckeditor5-dev-bump-year)                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-bump-year.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year)                   | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-bump-year)          |
| [`@ckeditor/ckeditor5-dev-ci`](/packages/ckeditor5-dev-ci)                                 | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-ci.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)                                 | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-ci)                 |
| [`@ckeditor/ckeditor5-dev-dependency-checker`](/packages/ckeditor5-dev-dependency-checker) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dependency-checker.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker) | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dependency-checker) |
| [`@ckeditor/ckeditor5-dev-docs`](/packages/ckeditor5-dev-docs)                             | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-docs.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)                         | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-docs)           |
| [`@ckeditor/ckeditor5-dev-release-tools`](/packages/ckeditor5-dev-release-tools)           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-release-tools.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)       | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-release-tools)  |
| [`@ckeditor/ckeditor5-dev-tests`](/packages/ckeditor5-dev-tests)                           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-tests.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)                       | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-tests)          |
| [`@ckeditor/ckeditor5-dev-transifex`](/packages/ckeditor5-dev-transifex)                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-transifex.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex)               | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-transifex)      |
| [`@ckeditor/ckeditor5-dev-utils`](/packages/ckeditor5-dev-utils)                           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-utils.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)                       | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-utils)          |
| [`@ckeditor/ckeditor5-dev-translations`](/packages/ckeditor5-dev-translations)             | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-translations.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)         | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-translations)   |
| [`@ckeditor/ckeditor5-dev-web-crawler`](/packages/ckeditor5-dev-web-crawler)               | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-web-crawler.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)           | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/ckeditor5-dev-web-crawler)    |
| [`@ckeditor/jsdoc-plugins`](/packages/jsdoc-plugins)                                       | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fjsdoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins)                                   | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/jsdoc-plugins)                |
| [`@ckeditor/typedoc-plugins`](/packages/typedoc-plugins)                                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Ftypedoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins)                                 | ![Dependency Status](https://img.shields.io/librariesio/release/npm/@ckeditor/typedoc-plugins)              |

## Cloning

1. Clone this repository.
2. Do `yarn install` inside (this package uses yarn workspaces).
3. You're ready to go!

## Testing

Tests:

```bash
yarn run test
```

Tests with the debug mode on:

```bash
DEBUG=true yarn run test
```

Test a single package:

```bash
./node_modules/.bin/mocha packages/ckeditor5-dev-release-tools/tests/* --recursive
```

Code coverage:

```bash
yarn run coverage
```

## Releasing packages

### Changelog

1. Fetch all changes and switch to `master`!
2. Execute `npm run changelog`:
  * This task checks what changed in each package and bumps the version accordingly. If nothing changed at all, it won't create a new changelog entry. If changes were irrelevant (e.g. only depedencies) it will create an "internal changes" entry.
  * Scan the logs which are printed by the tool in search for errors (incorrect changelog entries). Incorrect entries (e.g. ones without the type) are being ignored. You may need to create entries for them manually. This is done directly in `CHANGELOG.md` (in the root directory). Make sure to verify the proposed version after you modify the changelog.
    * When unsure what has really changed in this version of a specific package, use `git diff <hash of previous release> packages/ckeditor5-dev-<name>/`.

### Publishing

After generating the changelog, you are able to release the package.

First, you need to bump the version:

```bash
npm run release:bump-version
```

You can also use the `--dry-run` option in order to see what this task does.

After bumping the version, you can publish the changes:

```bash
npm run release:publish
```

As in the previous task, the `--dry-run` option is also available.

Your job's done. You can go now to `ckeditor5`, remove `yarn.lock`, potentially update something in `package.json`, run `yarn install` and commit that as `"Internal: Updated dependencies."`.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
