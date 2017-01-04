CKEditor 5 development environment tasks
========================================

Tasks used during development of [CKEditor 5](https://ckeditor5.github.io).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

```
npm i --save-dev @ckeditor/ckeditor5-dev-env
```

Description of each development task can be found here: <https://github.com/ckeditor/ckeditor5/wiki/Development-Workflow>.

To include development tasks in your `gulpfile.js`:

```js
const config = {
	WORKSPACE_DIR: '..'
};
const ckeditor5DevEnv = require( '@ckeditor/ckeditor5-dev-env' )( config );
const utils = require( '@ckeditor/ckeditor5-dev-env/lib/utils/changelog' );

gulp.task( 'init', ckeditor5DevEnv.initRepository );
gulp.task( 'create-package', ckeditor5DevEnv.createPackage );
gulp.task( 'update', ckeditor5DevEnv.updateRepositories );
gulp.task( 'pull', ckeditor5DevEnv.updateRepositories );
gulp.task( 'status', ckeditor5DevEnv.checkStatus );
gulp.task( 'st', ckeditor5DevEnv.checkStatus );
gulp.task( 'relink', ckeditor5DevEnv.relink );
gulp.task( 'install', ckeditor5DevEnv.installPackage );
gulp.task( 'exec', ckeditor5DevEnv.execOnRepositories );
gulp.task( 'changelog', () => ckeditor5Env.generateChangeLog( utils.parseArguments() ) );
gulp.task( 'release', () => ckeditor5Env.createRelease( utils.parseArguments() ) );
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

### Creating a release

## License

Licensed under the GPL, LGPL and MPL licenses, at your choice. For full details about the license, please check the `LICENSE.md` file.
