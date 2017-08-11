CKEditor 5 development environment tasks
========================================

Tasks used during development of [CKEditor 5](https://ckeditor5.github.io).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Release tools

### Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-env
```

Then add the tasks to `gulpfile.js`:

```js
// Generate changelog for the current package.
gulp.task( 'changelog:self', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).generateChangelog();
} );

// Generate changelog for all dependencies.
gulp.task( 'changelog:packages', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).generateChangelogForDependencies( getReleaseToolsOptions() );
} );

// Create release for the current package.
gulp.task( 'release:self', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).createRelease( getReleaseToolsOptions() );
} );

// Create release for all dependencies.
gulp.task( 'release:packages', () => {
	return require( '@ckeditor/ckeditor5-dev-env' ).releaseDependencies( getReleaseToolsOptions() );
} );

function getReleaseToolsOptions() {
	return require( 'ckeditor5-dev/packages/ckeditor5-dev-env/lib/release-tools/utils/getoptions' )();
}
```

### Generating changelog

This tool can generate a changelog file based on commits in the repository. It can also propose what should be the next release (according to the [SemVer](http://semver.org)).

Read more about the [git commit message convention](https://github.com/ckeditor/ckeditor5-design/wiki/Git-commit-message-convention) implemented by this tool.

### Creating a release

Required parameters:

* `token` - a GitHub token used for creating a new release on GitHub.

Process:

* Bump up the version in `package.json` and version of all dependencies.
* Commit these changes as `Release: vX.Y.Z.`,
* Create a tag `vX.Y.Z`,
* Push the commit and tag,
* Create a [GitHub release](https://help.github.com/articles/creating-releases/).

Notes for the release are taken from the changelog.

## Changelog

The changes are described in the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-env/CHANGELOG.md) file.

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
