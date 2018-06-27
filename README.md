CKEditor 5 development tools packages
=====================================

[![Build Status](https://travis-ci.org/ckeditor/ckeditor5-dev.svg?branch=master)](https://travis-ci.org/ckeditor/ckeditor5-dev)
[![Coverage Status](https://coveralls.io/repos/github/ckeditor/ckeditor5-dev/badge.svg?branch=master)](https://coveralls.io/github/ckeditor/ckeditor5-dev?branch=master)

## Packages

| Package | Version | Dependencies |
|---------|---------|--------------|
| [`@ckeditor/ckeditor5-dev-docs`](/packages/ckeditor5-dev-docs) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-docs.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-docs) | [![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev.svg?path=packages/ckeditor5-dev-docs)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-docs) [![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev/dev-status.svg?path=packages/ckeditor5-dev-docs)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-docs&type=dev) |
| [`@ckeditor/ckeditor5-dev-env`](/packages/ckeditor5-dev-env) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-env.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-env) | [![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev.svg?path=packages/ckeditor5-dev-env)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-env) [![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev/dev-status.svg?path=packages/ckeditor5-dev-env)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-env&type=dev) |
| [`@ckeditor/ckeditor5-dev-tests`](/packages/ckeditor5-dev-tests) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-tests.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests) | [![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev.svg?path=packages/ckeditor5-dev-tests)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-tests) [![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev/dev-status.svg?path=packages/ckeditor5-dev-tests)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-tests&type=dev) |
| [`@ckeditor/ckeditor5-dev-utils`](/packages/ckeditor5-dev-utils) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-utils.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-utils) | [![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev.svg?path=packages/ckeditor5-dev-utils)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-utils) [![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev/dev-status.svg?path=packages/ckeditor5-dev-utils)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-utils&type=dev) |
| [`@ckeditor/ckeditor5-dev-webpack-plugin`](/packages/ckeditor5-dev-webpack-plugin) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-webpack-plugin.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-webpack-plugin) | [![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev.svg?path=packages/ckeditor5-dev-webpack-plugin)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-webpack-plugin) [![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev/dev-status.svg?path=packages/ckeditor5-dev-webpack-plugin)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/ckeditor5-dev-webpack-plugin&type=dev) |
| [`@ckeditor/jsdoc-plugins`](/packages/jsdoc-plugins) | [![npm version](https://badge.fury.io/js/%40ckeditor%2Fjsdoc-plugins.svg)](https://www.npmjs.com/package/@ckeditor/jsdoc-plugins) | [![Dependency Status](https://david-dm.org/ckeditor/ckeditor5-dev.svg?path=packages/jsdoc-plugins)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/jsdoc-plugins) [![devDependency Status](https://david-dm.org/ckeditor/ckeditor5-dev/dev-status.svg?path=packages/jsdoc-plugins)](https://david-dm.org/ckeditor/ckeditor5-dev?path=packages/jsdoc-plugins&type=dev) |

## Testing

Tests:

```bash
npm test
```

Tests with Debug mode:

```bash
DEBUG=true npm test 
```

Test a single package:

```bash
./node_modules/.bin/mocha packages/ckeditor5-dev-env/tests/* --recursive
```

Code coverage:

```bash
npm run coverage
```

## Releasing

1. Fetch all changes and switch to `master`!
1. Execute `npm run changelog`.
   * At the current stage, a single change will be added to all packages which it touched. Sometimes, this means that in one of these packages the entry will not have much sense. Browse the changes, check if they are relevant.
      * If not and the package should not be released, just type "skip". However, this is not the best option because Lerna will also recognised this package as changed and will try to release it.
      * If the changes are a bit irrelevant, but the package still should be released, pick the "patch" bump, remove all the irrelevant entries from the changelog and if it became empty after that, add the "Internal changes only (updated dependencies, documentation, etc.)" text.
      * Remove the irrelevant changes from the changelog.
   * When unsure what has really changed in this version, use `git diff <hash of previous release> packages/ckeditor5-dev-<name>/`.
1. After reviewing the changelog, push the commit to GitHub.
1. Now, release the changed packages using `lerna publish`.

   Lerna may propose to release more packages than you'd want – e.g. one of the packages might have some totally irrelevant change which you don't want to release now. You can do that by calling e.g.: `lerna publish --scope="@ckeditor/ckeditor5-dev-?(env|utils|webpack-plugin)"`. However, this means that if one of ignored packages depends on one of the release ones it won't have a version bump... so usually it's better to just release everything (so also – to generate changelog for every, even slightest change).

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
