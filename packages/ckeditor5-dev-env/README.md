CKEditor 5 development environment tasks
========================================

Tasks used during development of [CKEditor 5](https://ckeditor5.github.io).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Release tools

### Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-env
```

Then add the tasks to `gulpfile.js`

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

In order to put a commit to the changelog, the commit has to look like:

```
Type: The short sentence about the commit.

Optional description.

NOTE: Special note to be marked in the changelog.

BREAKING CHANGE: If any breaking changes were done, they need to be listed here.
```

Accepted types of the commit:

<table>
<thead>
	<tr>
		<th>Type</th>
		<th>Release</th>
		<th>Description</th>
		<th>Changelog</th>
	</tr>
</thead>
<tbody>
	<tr>
		<td>Feature</td>
		<td><code>minor</code></td>
		<td>A new feature.</td>
		<td>Visible</td>
	</tr>
	<tr>
		<td>Fix</td>
		<td><code>patch</code></td>
		<td>A bug fix.</td>
		<td>Visible</td>
	</tr>
	<tr>
		<td>Other</td>
		<td><code>patch</code></td>
		<td>An enhancement – when it's neither a bug fix nor a feature. For example – public API refactoring. Use it also if you don't want to admit that it was a bug ;).</td>
		<td>Visible</td>
	</tr>
	<tr>
		<td>Code style</td>
		<td><code>patch</code></td>
		<td>Our beloved code style improvements (used in the broad meaning of general code quality).</td>
		<td>Hidden</td>
	</tr>
	<tr>
		<td>Docs</td>
		<td><code>patch</code></td>
		<td>Update the documentation.</td>
		<td>Hidden</td>
	</tr>
	<tr>
		<td>Internal</td>
		<td><code>patch</code></td>
		<td>Other kinds of internal changes.</td>
		<td>Hidden</td>
	</tr>
	<tr>
		<td>Tests</td>
		<td><code>patch</code></td>
		<td>Changes in test files.</td>
		<td>Hidden</td>
	</tr>
	<tr>
		<td>Revert</td>
		<td><code>patch</code></td>
		<td>Revert of some commit.</td>
		<td>Hidden</td>
	</tr>
	<tr>
		<td>Release</td>
		<td><code>patch</code></td>
		<td>Special type of commit used by the release tools.</td>
		<td>Hidden</td>
	</tr>
</tbody>
</table>

Each commit can contain additional notes which will be inserted to the changelog:

<table>
<thead>
	<tr>
		<th>Type</th>
		<th>Is backward compatible?</th>
	</tr>
</thead>
<tbody>
	<tr>
		<td><code>NOTE</code></td>
		<td>Yes</td>
	</tr>
	<tr>
		<td><code>BREAKING CHANGE</code></td>
		<td>No</td>
	</tr>
</tbody>
</table>

If any visible change contains the `BREAKING CHANGE` note, the next release will be marked as `major` automatically.

### Example commits

A new feature without any breaking changes.

```
Feature: Added support for RTL languages. Closes: #1.

Now, RTL content will be rendered correctly.

NOTE: Make sure to set `config.contentDirection` correctly.
```

A bug fix for an existing feature:

```
Fix: The editor will be great again. Fixes: #3.
```

Commit with updated the documentation:

```
Docs: Updated the README.
```

Commit which provides / changes the tests:

```
Tests: Introduced missing tests. Resolves #5.
```

An enhancement which is not backward compatible. Public API has been changed:

```
Other: Extracted the `utils.moo()` to a separate package. Closes: #9.

BREAKING CHANGE: The `util.moo()` is now available in the `moo` packages. See: #9.
```

For the above commits, changelog will look like:

```md
Changelog
=========

## [1.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v1.0.0...v0.0.1) (2017-01-04)


### Bug fixes

* The editor will be great again. Fixes: [#3](https://github.com/ckeditor/ckeditor5-dev/issue/3). ([a0b4ce8](https://github.com/ckeditor/ckeditor5-dev/commit/a0b4ce8))


### Other changes

* Extracted the `utils.moo()` to a separate package. Thanks to [@CKEditor](https://github.com/CKEditor). ([e8cc04f](https://github.com/ckeditor/ckeditor5-dev/commit/e8cc04f))


### Features

* Added support for RTL languages. Closes: [#1](https://github.com/ckeditor/ckeditor5-dev/issue/1). ([adc59ed](https://github.com/ckeditor/ckeditor5-dev/commit/adc59ed))


### BREAKING CHANGE

* The `util.moo()` is now available in the `moo` packages. See: [#9](https://github.com/ckeditor/ckeditor5-dev/issue/9).

### NOTE

* Make sure to set `config.contentDirection` correctly.
```

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

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
