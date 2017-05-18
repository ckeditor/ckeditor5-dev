/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const { tools, stream } = require( '@ckeditor/ckeditor5-dev-utils' );
const { changelogHeader, getChangelog, getChangesForVersion } = require( '../../../lib/release-tools/utils/changelog' );

describe( 'dev-env/release-tools/utils', () => {
	const url = 'https://github.com/ckeditor/ckeditor5-test-package';

	let tmpCwd, cwd, generateChangelogFromCommits, stubs, sandbox;

	// These tests create a chain of releases.
	describe( 'generateChangelogFromCommits() - integration test', function() {
		this.timeout( 5000 );

		before( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( __dirname + path.sep );
			process.chdir( tmpCwd );

			exec( 'git init' );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}

			const packageJson = {
				name: '@ckeditor/ckeditor5-test-package',
				bugs: `${ url }/issues`,
				repository: url
			};

			fs.writeFileSync(
				path.join( tmpCwd, 'package.json' ),
				JSON.stringify( packageJson, null, '\t' )
			);
		} );

		after( () => {
			exec( `rm -rf ${ tmpCwd }` );
			process.chdir( cwd );
		} );

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			stubs = {
				logger: {
					info: sandbox.stub(),
					warning: sandbox.stub(),
					error: sandbox.stub()
				},
			};

			generateChangelogFromCommits = proxyquire( '../../../lib/release-tools/utils/generatechangelogfromcommits', {
				'@ckeditor/ckeditor5-dev-utils': {
					stream,
					logger() {
						return stubs.logger;
					}
				}
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		// Done callback is called manually because these tests are slow and sometimes Mocha throws a timeout error.
		it( 'generates a changelog for the first time', () => {
			exec( 'git commit --allow-empty --message "Internal: An initial commit."' );

			return generateChangelog( '0.0.1' )
				.then( () => {
					expect( stubs.logger.warning.calledOnce ).to.equal( true );
					expect( getChangelog() ).to.contain( changelogHeader );
					expect( getChangesForVersion( '0.0.1' ) ).to.contain(
						'Internal changes only (updated dependencies, documentation, etc.).'
					);

					release( '0.0.1' );
				} );
		} );

		it( 'title of the next release should be a link which compares current version with the previous one', () => {
			exec( 'git commit --allow-empty --message "Feature: Some amazing feature. Closes #1."' );

			return generateChangelog( '0.1.0', '0.0.1' )
				.then( () => {
					expect( getChangelog() ).to.contain(
						'## [0.1.0](https://github.com/ckeditor/ckeditor5-test-package/compare/v0.0.1...v0.1.0)'
					);

					release( '0.1.0' );
				} );
		} );

		it( 'does not hoist issues from the commit body', () => {
			exec( 'git commit --allow-empty ' +
				'--message "Feature: Another feature. Closes #2." ' +
				'--message "This PR also closes #3 and #4."' );

			return generateChangelog( '0.2.0', '0.1.0' )
				.then( () => {
					const latestChangelog = replaceCommitIds( getChangesForVersion( '0.2.0' ) );

					/* eslint-disable max-len */
					const expectedChangelog = `
### Features

* Another feature. Closes [#2](https://github.com/ckeditor/ckeditor5-test-package/issues/2). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))

  This PR also closes [#3](https://github.com/ckeditor/ckeditor5-test-package/issues/3) and [#4](https://github.com/ckeditor/ckeditor5-test-package/issues/4).
`;
					/* eslint-enable max-len */

					expect( latestChangelog ).to.equal( expectedChangelog.trim() );

					release( '0.2.0' );
				} );
		} );

		it( 'does not hoist issues from the commit body for merge commit', () => {
			exec( 'git commit --allow-empty ' +
				'--message "Merge pull request #5 from ckeditor/t/4" ' +
				'--message "Fix: Amazing fix. Closes #5." ' +
				'--message "The PR also finally closes #3 and #4. So good!"' );

			return generateChangelog( '0.2.1', '0.2.0' )
				.then( () => {
					const latestChangelog = replaceCommitIds( getChangesForVersion( '0.2.1' ) );

					/* eslint-disable max-len */
					const expectedChangelog = `
### Bug fixes

* Amazing fix. Closes [#5](https://github.com/ckeditor/ckeditor5-test-package/issues/5). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))

  The PR also finally closes [#3](https://github.com/ckeditor/ckeditor5-test-package/issues/3) and [#4](https://github.com/ckeditor/ckeditor5-test-package/issues/4). So good!
`;
					/* eslint-enable max-len */

					expect( latestChangelog ).to.equal( expectedChangelog.trim() );

					release( '0.2.1' );
				} );
		} );

		it( 'does not hoist issues from the commit body with additional notes for merge commit', () => {
			exec( 'git commit --allow-empty ' +
				'--message "Merge pull request #7 from ckeditor/t/6" ' +
				'--message "Other: Some docs improvements. Closes #6." ' +
				'--message "Did you see the #3 and #4?" ' +
				'--message "NOTE: Please read #1." ' +
				'--message "BREAKING CHANGES: Some breaking change." ' );

			return generateChangelog( '0.3.0', '0.2.1' )
				.then( () => {
					const latestChangelog = replaceCommitIds( getChangesForVersion( '0.3.0' ) );

					/* eslint-disable max-len */
					const expectedChangelog = `
### Other changes

* Some docs improvements. Closes [#6](https://github.com/ckeditor/ckeditor5-test-package/issues/6). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))

  Did you see the [#3](https://github.com/ckeditor/ckeditor5-test-package/issues/3) and [#4](https://github.com/ckeditor/ckeditor5-test-package/issues/4)?

### BREAKING CHANGES

* Some breaking change.

### NOTE

* Please read [#1](https://github.com/ckeditor/ckeditor5-test-package/issues/1).
`;
					/* eslint-enable max-len */

					expect( latestChangelog ).to.equal( expectedChangelog.trim() );

					release( '0.3.0' );
				} );
		} );

		it( 'does not hoist issues from the commit body with additional notes', () => {
			exec( 'git commit --allow-empty ' +
				'--message "Feature: Issues will not be hoisted. Closes #8." ' +
				'--message "All details have been described in #1." ' +
				'--message "NOTE: Please read #1." ' +
				'--message "BREAKING CHANGES: Some breaking change." ' );

			return generateChangelog( '0.4.0', '0.3.0' )
				.then( () => {
					const latestChangelog = replaceCommitIds( getChangesForVersion( '0.4.0' ) );

					/* eslint-disable max-len */
					const expectedChangelog = `
### Features

* Issues will not be hoisted. Closes [#8](https://github.com/ckeditor/ckeditor5-test-package/issues/8). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))

  All details have been described in [#1](https://github.com/ckeditor/ckeditor5-test-package/issues/1).

### BREAKING CHANGES

* Some breaking change.

### NOTE

* Please read [#1](https://github.com/ckeditor/ckeditor5-test-package/issues/1).
`;
					/* eslint-enable max-len */

					expect( latestChangelog ).to.equal( expectedChangelog.trim() );

					release( '0.4.0' );
				} );
		} );

		it( 'changelog should contain 2 blank lines for changelog with internal changes', () => {
			exec( 'git commit --allow-empty --message "Docs: Updated README."' );

			return generateChangelog( '0.4.1', '0.4.0' )
				.then( () => {
					const expectedChangelogeEntries = [
						'## [0.4.1](https://github.com/ckeditor/ckeditor5-test-package/compare/v0.4.0...v0.4.1) (0000-00-00)',
						'',
						'Internal changes only (updated dependencies, documentation, etc.).',
						'',
						'',
						'## [0.4.0](https://github.com/ckeditor/ckeditor5-test-package/compare/v0.3.0...v0.4.0) (0000-00-00)'
					];
					const changelogAsArray = replaceDates( getChangelog() ).replace( changelogHeader, '' ).split( '\n' );

					expectedChangelogeEntries.forEach( ( row, index ) => {
						expect( row ).to.equal( changelogAsArray[ index ], `Index: ${ index }` );
					} );

					release( '0.4.1' );
				} );
		} );

		// See: https://github.com/ckeditor/ckeditor5-dev/issues/184
		it( 'generates changelog as "internal" even if commits were made', () => {
			exec( 'git commit --allow-empty ' +
				'--message "Feature: Issues will not be hoisted. Closes #8." ' +
				'--message "All details have been described in #1." ' +
				'--message "NOTE: Please read #1." ' +
				'--message "BREAKING CHANGES: Some breaking change." ' );

			exec( 'git commit --allow-empty ' +
				'--message "Feature: Issues will not be hoisted. Closes #8." ' +
				'--message "All details have been described in #1." ' +
				'--message "NOTE: Please read #1." ' +
				'--message "BREAKING CHANGES: Some breaking change." ' );

			return generateChangelog( '0.4.1', '0.4.0', true )
				.then( () => {
					const latestChangelog = getChangesForVersion( '0.4.1' );

					expect( latestChangelog ).to.equal( 'Internal changes only (updated dependencies, documentation, etc.).' );
				} );
		} );
	} );

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}

	function generateChangelog( version, previousVersion = null, isInternalRelease = false ) {
		const transform = require( '../../../lib/release-tools/utils/transform-commit/transformcommitforsubrepository' );

		return generateChangelogFromCommits( {
			version,
			isInternalRelease,
			newTagName: 'v' + version,
			tagName: previousVersion ? 'v' + previousVersion : null,
			transformCommit: transform,
		} );
	}

	function release( version ) {
		exec( `npm version ${ version } --no-git-tag-version` );
		exec( 'git add package.json' );
		exec( `git commit --message "Release: v${ version }."` );
		exec( `git tag v${ version }` );
	}

	// Replaces random commits ID to known string. It allows comparing changelog to strings
	// which makes the test easier to read.
	function replaceCommitIds( changelog ) {
		return changelog.replace( /\[[a-z0-9]{7}\]/g, '[XXXXXXX]' )
			.replace( /commit\/[a-z0-9]{7}/g, 'commit/XXXXXXX' );
	}

	function replaceDates( changelog ) {
		return changelog.replace( /\) \(\d{4}-\d{2}-\d{2}\)/g, ') (0000-00-00)' );
	}
} );
