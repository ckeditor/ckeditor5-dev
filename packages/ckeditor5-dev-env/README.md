CKEditor 5 development environment tasks
========================================

Tasks used during development of [CKEditor 5](https://ckeditor.com).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Release tools

### Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-env
```

Then create a script that run tasks:

```js
// scripts/changelog-self.js: Generate changelog for the current package.
require( '@ckeditor/ckeditor5-dev-env' ).generateChangelogForSinglePackage();
```

```js
// scripts/changelog-repos.js: Generate changelog for all dependencies (repository using multiple repositories).
require( '@ckeditor/ckeditor5-dev-env' ).generateChangelogForSubRepositories( /* options */ );

// See the `options` argument:
// https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-env/lib/release-tools/tasks/generatechangelogforsubrepositories.js#L20-L27
```

```js
// scripts/changelog-packages.js: Generate changelog for all packages (repository contains multiple packages).
require( '@ckeditor/ckeditor5-dev-env' ).generateChangelogForSubPackages( /* options */ );

// See the `options` argument:
// https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-env/lib/release-tools/tasks/generatechangelogforsubpackages.js#L20-L27
```

```js
// scripts/release-bump-versions.js: Validates and updates version for all packages (includes the package found in options.cwd)
require( '@ckeditor/ckeditor5-dev-env' ).bumpVersions( /* options */ );

// See the `options` argument:
// https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-env/lib/release-tools/tasks/bumpversions.js#L20-L27
```

```js
// scripts/release-packages.js: Publish all changes.
require( '@ckeditor/ckeditor5-dev-env' ).releaseSubRepositories( /* options */ );

// See the `options` argument:
// https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-env/lib/release-tools/tasks/releasesubrepositories.js#L20-L27
```

### Generating changelog

This tool can generate a changelog file based on commits in the repository. It can also propose what should be the next release version (according to [SemVer](http://semver.org)).

Read more about the [git commit message convention](https://github.com/ckeditor/ckeditor5-design/wiki/Git-commit-message-convention) implemented by this tool.

### Creating a release for multiple repositories

**Note:** Before running the bumping versions task you need to generate the changelog for changes in the version to be released.

The process implemented by the tool:

1. Read a new release version from the changelog (the last header),
1. Filter out packages which won't be released (no changes or dependencies has not changed),
1. Update new versions of packages in `package.json` for all released packages,
1. Commit these changes as `Release: vX.Y.Z.`,
1. Create a tag `vX.Y.Z`.

### Publishing changes

**Note:** Before publishing changes you need to bump versions in all dependencies.

The process implemented by the tool:

1. Compares versions released on NPM and GitHub. Based on that, the tool know what should be published. You can call the same script multiple times and nothing wrong happens.
1. If choose publish on NPM: the tool publish changes on NPM.
1. If choose publish on GitHub: the tool creates a [GitHub release](https://help.github.com/articles/creating-releases/). Notes for the release are taken from the changelog.
1. If nothing was selected: the tool does nothing. No publish, no push, no creating releases.

## Translation tools

Available tasks:
- `collect` - Collects translation strings ( from `t()` calls ) and stores them in ckeditor5/build/.transifex directory.
- `upload` - Uploads translations to the Transifex from collected files.
- `download` - Downloads translations from the Transifex for each package and language.

### Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-env
```

Then use `ckeditor5-dev-env-translations` command:

```
# directly from command line:
node ./node_modules/bin/ckeditor5-dev-env-translations collect

# using npx:
npx ckeditor5-dev-env-translations collect
```

Or add to `package.json` scripts:

```
{
  "scripts": {
    "translations:collect": "ckeditor5-dev-env-translations collect",
    "translations:download": "ckeditor5-dev-env-translations download",
    "translations:upload": "ckeditor5-dev-env-translations upload"
  }
}
```

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-env/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
