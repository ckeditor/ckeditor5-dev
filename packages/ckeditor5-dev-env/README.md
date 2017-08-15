CKEditor 5 development environment tasks
========================================

Tasks used during development of [CKEditor 5](https://ckeditor5.github.io).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Release tools

### Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-env
```

Then add tasks to your `gulpfile.js`:

```js
// Generate changelog for the current package.
gulp.task( 'changelog:self', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).generateChangelogForSinglePackage();
} );

// Generate changelog for all dependencies (repository using multiple repositories).
gulp.task( 'changelog:packages', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).generateChangelogForSubRepositories( /* options */ );
} );

// Generate changelog for all packages (repository contains multiple packages).
gulp.task( 'changelog:packages', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).generateChangelogForSubPackages( /* options */ );
} );

// Create release for the current package.
gulp.task( 'release:self', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).releaseRepository();
} );

// Create release for all dependencies.
gulp.task( 'release:packages', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).releaseSubRepositories( /* options */ );
} );
```

### Generating changelog

This tool can generate a changelog file based on commits in the repository. It can also propose what should be the next release version (according to [SemVer](http://semver.org)).

Read more about the [git commit message convention](https://github.com/ckeditor/ckeditor5-design/wiki/Git-commit-message-convention) implemented by this tool.

### Creating a release for multiple repositories

**Note:** Before running the release task you need to generate the changelog for changes in the version to be released.

The process implemented by the tool:

1. Read a new release version from the changelog (the last header),
1. Filter out packages which won't be released (no changes or dependencies has not changed),
1. Update new versions of packages in `package.json` for all released packages,
1. Commit these changes as `Release: vX.Y.Z.`,
1. Create a tag `vX.Y.Z`,
1. Push the commit and tag,
1. Optional: create a [GitHub release](https://help.github.com/articles/creating-releases/) or/and [NPM](https://docs.npmjs.com/getting-started/publishing-npm-packages).

	Notes for the release are taken from the changelog.

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-env/CHANGELOG.md) file.

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
