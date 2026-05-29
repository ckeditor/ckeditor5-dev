CKEditor 5 development tools packages
=====================================

[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)
[![Coverage Status](https://codecov.io/github/ckeditor/ckeditor5-dev/graph/badge.svg)](https://codecov.io/github/ckeditor/ckeditor5-dev)

## Packages

This repository is a monorepo. It contains multiple npm packages.

| Package                                                                                    | Version                                                                                                                                                             |
|--------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`@ckeditor/ckeditor5-dev-bump-year`](/packages/ckeditor5-dev-bump-year)                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-bump-year.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-bump-year)                   |
| [`@ckeditor/ckeditor5-dev-changelog`](/packages/ckeditor5-dev-changelog)                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-changelog.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-changelog)                   |
| [`@ckeditor/ckeditor5-dev-ci`](/packages/ckeditor5-dev-ci)                                 | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-ci.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-ci)                                 |
| [`@ckeditor/ckeditor5-dev-dependency-checker`](/packages/ckeditor5-dev-dependency-checker) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dependency-checker.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-dependency-checker) |
| [`@ckeditor/ckeditor5-dev-docs`](/packages/ckeditor5-dev-docs)                             | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-docs.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs)                         |
| [`@ckeditor/ckeditor5-dev-release-tools`](/packages/ckeditor5-dev-release-tools)           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-release-tools.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-release-tools)       |
| [`@ckeditor/ckeditor5-dev-tests`](/packages/ckeditor5-dev-tests)                           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-tests.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)                       |
| [`@ckeditor/ckeditor5-dev-utils`](/packages/ckeditor5-dev-utils)                           | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-utils.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils)                       |
| [`@ckeditor/ckeditor5-dev-translations`](/packages/ckeditor5-dev-translations)             | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-translations.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-translations)         |
| [`@ckeditor/ckeditor5-dev-web-crawler`](/packages/ckeditor5-dev-web-crawler)               | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-web-crawler.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-web-crawler)           |
| [`@ckeditor/typedoc-plugins`](/packages/typedoc-plugins)                                   | [![npm version](https://badge.fury.io/js/%40ckeditor%2Ftypedoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/typedoc-plugins)                               |

## Cloning

> [!NOTE]
> This project requires **pnpm v10** or higher. You can check your version with `pnpm --version` and update if needed with `npm install -g pnpm@latest`.

1. Clone this repository.
2. Do `pnpm install` inside (this package uses pnpm workspaces).
3. You're ready to go!

## Testing

Tests:

```bash
pnpm run test
```

Each package defines its own tests. To run them, change your working directory and use the `test` script.

Code coverage:

```bash
pnpm run coverage
```

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
