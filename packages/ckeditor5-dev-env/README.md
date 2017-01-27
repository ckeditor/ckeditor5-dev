CKEditor 5 development environment tasks
========================================

Tasks used during development of [CKEditor 5](https://ckeditor5.github.io).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-env
```

Then add the tasks to `gulpfile.js`

```js
// Generate changelog for current package.
gulp.task( 'changelog', () => {
	const ckeditor5DevEnv = require( '@ckeditor/ckeditor5-dev-env' );

	return ckeditor5DevEnv.generateChangelog();
} );

// Generate changelog for all dependencies.
gulp.task( 'changelog-packages', () => {
	const ckeditor5DevEnv = require( '@ckeditor/ckeditor5-dev-env' );
	const options = devTaskOptions();
	
	options.cwd = process.cwd();
	
	// Directory to the dependencies.
	options.workspace = 'packages/';

	return ckeditor5DevEnv.generateChangelogForDependencies( options );
} );

// Create release for current package.
gulp.task( 'release', () => {
	const ckeditor5DevEnv = require( '@ckeditor/ckeditor5-dev-env' );

	return ckeditor5DevEnv.createRelease( devTaskOptions() );
} );

// Create release for all dependencies.
gulp.task( 'release-packages', () => {
	const ckeditor5DevEnv = require( '@ckeditor/ckeditor5-dev-env' );
	const options = devTaskOptions();
	
	options.cwd = process.cwd();
	
	// Directory to the dependencies.
	options.workspace = 'packages/';
	
	return ckeditor5DevEnv.releaseDependencies( options );
} );

function devTaskOptions() {
	return require( '@ckeditor/ckeditor5-dev-env/lib/utils/parsearguments' )();
}
```

### Generating changelog

This tool can generate the changelog file based on commits in the repository. It can also predict what is the next release (follows the [SemVer](http://semver.org)).

In order to put a commit to the changelog, the commit has to look like:

```
Type: The short sentence about the commit.

Not required an additional description of the commit.

NOTE: This note will be copied to the changelog.

BREAKING CHANGE: This sentence means - public API has been changed, the package isn't backward compatible. The sentence also will be copied to the changelog. 
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
		<td>Enhancement</td>
		<td><code>patch</code></td>
		<td>An enhancement for the code.</td>
		<td>Visible</td>
	</tr>
	<tr>
		<td>Internal Feature</td>
		<td><code>patch</code></td>
		<td>A feature which doesn't change the public API.</td>
		<td>Hidden</td>
	</tr>
	<tr>
		<td>Internal Fix</td>
		<td><code>patch</code></td>
		<td>A bug fix which doesn't change the public API.</td>
		<td>Hidden</td>
	</tr>
	<tr>
		<td>Internal Enhancement</td>
		<td><code>patch</code></td>
		<td>An enhancement for the code which doesn't change the public API.</td>
		<td>Hidden</td>
	</tr>
	<tr>
		<td>Docs</td>
		<td><code>patch</code></td>
		<td>Update the documentation.</td>
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
		<td>Realase commit.</td>
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

If any visible in changelog commit will contain the `BREAKING CHANGE` note, the next release will be marked as `major` automatically.

#### Examples commits

A new feature without any breaking changes.

```
Feature: A feature which is backward compatible. Closes: #1.

A sentence which describe what has been introduced.

NOTE: Note which will be inserted to the changelog.
```

A bug fix for the existing feature:

```
Fix: A fix for the feature. Fixes: #3.
```

Commit with updated the documentation:

```
Docs: Updated the README.
```

Commit which provides / changes the tests:

```
Tests: Introduced missing tests. Resolves #5.

NOTE: Code coverage is equal to 100%.
```

An enhancement which is not backward compatible. Public API has been changed:

```
Enhancement: A method reads parameters via CLI. Thanks to @CKEditor.

An additional description with an explanation why it has to be done.
Closes: #9.

BREAKING CHANGE: `method` accepts parameters passed via CLI only. See: #7.
```

For the above commits, changelog will look like:

```md
Changelog
=========

## [1.0.0](https://github.com/ckeditor/ckeditor5-dev/compare/v1.0.0...v0.0.1) (2017-01-04)


### Bug Fixes

* A fix for the feature. Fixes: [#3](https://github.com/ckeditor/ckeditor5-dev/issue/3). ([a0b4ce8](https://github.com/ckeditor/ckeditor5-dev/commit/a0b4ce8))


### Enhancements

* A method reads parameters via CLI. Thanks to [@CKEditor](https://github.com/CKEditor). ([e8cc04f](https://github.com/ckeditor/ckeditor5-dev/commit/e8cc04f))


### Features

* A feature which is backward compatible. Closes: [#1](https://github.com/ckeditor/ckeditor5-dev/issue/1). ([adc59ed](https://github.com/ckeditor/ckeditor5-dev/commit/adc59ed))


### BREAKING CHANGE

* `method` accepts parameters passed via CLI only. See: [#7](https://github.com/ckeditor/ckeditor5-dev/issue/7).

### NOTE

* Note which will be inserted to the changelog.
```

This tool doesn't commit the changes. You can still provide manual fixes if something was generated incorrectly.

### Creating a release

This tool creates a new release based on commits in the repository. Commits have to follow the same terms which tool for generating the changelog.
  
Required parameters:

- `token` - a GitHub token used for creating a new release on GitHub,
- `init` - if you create a first release using this package, set this flag on `true`.

Before starting the process, make sure that:

- Current branch is `master`,
- Current branch is up to date,
- Working directory is clean (only changelog or `package.json` can be modified).

The whole process does:

- Commits the changelog and `package.json` as `Release: vX.Y.Z.`,
- Creates a tag `vX.Y.Z`,
- Pushes the commits and tags,
- Creates a [GitHub release](https://help.github.com/articles/creating-releases/).

Note for the release is taken from the changelog. If you set the `init` flag on `true`, the whole changelog will be parsed.
In other cases, the changelog will be parsed until the last release.

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
