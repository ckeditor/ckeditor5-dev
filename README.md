CKEditor 5 development tools packages
=====================================

[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/ckeditor/ckeditor5-dev/badge.svg?branch=master)](https://coveralls.io/github/ckeditor/ckeditor5-dev?branch=master)

## Packages

This repository is a monorepo. It contains multiple npm packages.

| Package                                                                                    | Version                                                                                                                                                             |
|--------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`@ckeditor/ckeditor5-dev-bump-year`](/packages/ckeditor5-dev-bump-year)                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-bump-year.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year)                   |
| [`@ckeditor/ckeditor5-dev-ci`](/packages/ckeditor5-dev-ci)                                 | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-ci.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)                                 |
| [`@ckeditor/ckeditor5-dev-dependency-checker`](/packages/ckeditor5-dev-dependency-checker) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dependency-checker.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker) |
| [`@ckeditor/ckeditor5-dev-docs`](/packages/ckeditor5-dev-docs)                             | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-docs.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)                         |
| [`@ckeditor/ckeditor5-dev-release-tools`](/packages/ckeditor5-dev-release-tools)           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-release-tools.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)       |
| [`@ckeditor/ckeditor5-dev-tests`](/packages/ckeditor5-dev-tests)                           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-tests.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)                       |
| [`@ckeditor/ckeditor5-dev-transifex`](/packages/ckeditor5-dev-transifex)                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-transifex.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-transifex)               |
| [`@ckeditor/ckeditor5-dev-utils`](/packages/ckeditor5-dev-utils)                           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-utils.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)                       |
| [`@ckeditor/ckeditor5-dev-translations`](/packages/ckeditor5-dev-translations)             | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-translations.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)         |
| [`@ckeditor/ckeditor5-dev-web-crawler`](/packages/ckeditor5-dev-web-crawler)               | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-web-crawler.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)           |
| [`@ckeditor/jsdoc-plugins`](/packages/jsdoc-plugins)                                       | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fjsdoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins)                                   |
| [`@ckeditor/typedoc-plugins`](/packages/typedoc-plugins)                                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Ftypedoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins)                                 |

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

The release process is automated via CircleCI. Before you start, you need to prepare the changelog entries.

1. Make sure the `#master` branch is up-to-date: `git fetch && git checkout master && git pull`.
1. Prepare a release branch: `git checkout -b release-[YYYY-MM-DD]` where `YYYY-MM-DD` is the current day.
1. Generate the changelog entries: `yarn run changelog --branch release-[YYYY-MM-DD]`.
    * This task checks what changed in each package and bumps the version accordingly. If nothing changes at all, it won't create a new changelog entry. If changes were irrelevant (e.g., only dependencies), it would make an "_internal changes_" entry.
    * Scan the logs printed by the tool to search for errors (incorrect changelog entries). Incorrect entries (e.g., ones without the type) should be addressed. You may need to create entries for them manually. This is done directly in CHANGELOG.md (in the root directory). Make sure to verify the proposed version after you modify the changelog.
1. Commit all changes and prepare a new pull request targeting the `#master` branch.
1. Ping the @ckeditor/ckeditor-5-devops team to review the pull request and trigger the release process.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
