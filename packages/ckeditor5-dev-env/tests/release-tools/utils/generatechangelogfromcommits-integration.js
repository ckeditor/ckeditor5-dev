/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const { tools, stream } = require( '@ckeditor/ckeditor5-dev-utils' );
const {
	changelogHeader,
	getChangelog: _getChangelog,
	getChangesForVersion: _getChangesForVersion
} = require( '../../../lib/release-tools/utils/changelog' );

describe( 'dev-env/release-tools/utils', () => {
	const url = 'https://github.com/ckeditor/ckeditor5-test-package';

	let tmpCwd, cwd, generateChangelogFromCommits, stubs, sandbox;

	describe( 'generateChangelogFromCommits() - integration test', function() {
		this.timeout( 15 * 1000 );

		beforeEach( () => {
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

			sandbox = sinon.createSandbox();

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
			process.chdir( cwd );
			exec( `rm -rf ${ tmpCwd }` );

			sandbox.restore();
		} );

		it( 'generates a changelog for the first time', () => {
			return makeInitialRelease()
				.then( () => {
					expect( stubs.logger.warning.calledOnce ).to.equal( true );

					const generatedChangelog = getChangelog();

					expect( generatedChangelog ).to.contain( changelogHeader );

					const changelogWithoutHeader = generatedChangelog.replace( changelogHeader, '' );
					const changelogTitle = changelogWithoutHeader.split( '\n' )[ 0 ];
					const changes = changelogWithoutHeader.split( '\n' ).slice( 1 ).join( '\n' ).trim();

					expect( replaceDates( changelogTitle ) ).to.contain(
						'## [0.0.1](https://github.com/ckeditor/ckeditor5-test-package/tree/v0.0.1) (0000-00-00)'
					);

					expect( changes ).to.contain(
						'Internal changes only (updated dependencies, documentation, etc.).'
					);
				} );
		} );

		it( 'title of the next release should be a link which compares current version with the previous one', () => {
			makeCommit( 'Internal: An initial commit.' );

			return makeInitialRelease()
				.then( () => {
					makeCommit( 'Internal: An initial commit.' );
					makeCommit( 'Feature: Some amazing feature. Closes #1.' );

					return generateChangelog( '0.1.0' );
				} )
				.then( () => {
					expect( getChangelog() ).to.contain(
						'## [0.1.0](https://github.com/ckeditor/ckeditor5-test-package/compare/v0.0.1...v0.1.0)'
					);
				} );
		} );

		// See: https://github.com/ckeditor/ckeditor5-dev/issues/270#issuecomment-326807018
		it( 'handles a commit which does not end with a dot', () => {
			return makeInitialRelease()
				.then( () => {
					makeCommit( 'Feature: Another feature. Closes #2' );

					return generateChangelog( '0.1.0' );
				} )
				.then( () => {
					const latestChangelog = replaceCommitIds( getChangesForVersion( '0.1.0' ) );

					/* eslint-disable max-len */
					const expectedChangelog = normalizeStrings( `
### Features

* Another feature. Closes [#2](https://github.com/ckeditor/ckeditor5-test-package/issues/2). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))
` );
					/* eslint-enable max-len */

					expect( latestChangelog ).to.equal( expectedChangelog.trim() );
				} );
		} );

		describe( 'hoisting issues', () => {
			it( 'does not hoist issues from the commit body', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit( 'Feature: Another feature. Closes #2.', 'This PR also closes #3 and #4.' );

						return generateChangelog( '0.1.0' );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.1.0' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Features

* Another feature. Closes [#2](https://github.com/ckeditor/ckeditor5-test-package/issues/2). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))

  This PR also closes [#3](https://github.com/ckeditor/ckeditor5-test-package/issues/3) and [#4](https://github.com/ckeditor/ckeditor5-test-package/issues/4).
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );

			it( 'does not hoist issues from the commit body for merge commit', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit(
							'Merge pull request #5 from ckeditor/t/4',
							'Fix: Amazing fix. Closes #5.',
							'The PR also finally closes #3 and #4. So good!'
						);

						return generateChangelog( '0.1.1' );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.1.1' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Bug fixes

* Amazing fix. Closes [#5](https://github.com/ckeditor/ckeditor5-test-package/issues/5). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))

  The PR also finally closes [#3](https://github.com/ckeditor/ckeditor5-test-package/issues/3) and [#4](https://github.com/ckeditor/ckeditor5-test-package/issues/4). So good!
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );

			it( 'does not hoist issues from the commit body with additional notes for merge commit', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit(
							'Merge pull request #7 from ckeditor/t/6',
							'Other: Some docs improvements. Closes #6.',
							'Did you see the #3 and #4?',
							'NOTE: Please read #1.',
							'BREAKING CHANGES: Some breaking change.'
						);

						return generateChangelog( '0.2.0' );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.2.0' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Other changes

* Some docs improvements. Closes [#6](https://github.com/ckeditor/ckeditor5-test-package/issues/6). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))

  Did you see the [#3](https://github.com/ckeditor/ckeditor5-test-package/issues/3) and [#4](https://github.com/ckeditor/ckeditor5-test-package/issues/4)?

### BREAKING CHANGES

* Some breaking change.

### NOTE

* Please read [#1](https://github.com/ckeditor/ckeditor5-test-package/issues/1).
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );

			it( 'does not hoist issues from the commit body with additional notes', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit(
							'Feature: Issues will not be hoisted. Closes #8.',
							'All details have been described in #1.',
							'NOTE: Please read #1.',
							'BREAKING CHANGES: Some breaking change.'
						);

						return generateChangelog( '0.2.0' );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.2.0' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Features

* Issues will not be hoisted. Closes [#8](https://github.com/ckeditor/ckeditor5-test-package/issues/8). ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))

  All details have been described in [#1](https://github.com/ckeditor/ckeditor5-test-package/issues/1).

### BREAKING CHANGES

* Some breaking change.

### NOTE

* Please read [#1](https://github.com/ckeditor/ckeditor5-test-package/issues/1).
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );
		} );

		// See: https://github.com/ckeditor/ckeditor5-dev/issues/270
		describe( 'merge commits', () => {
			it( 'works with merge commit which is not a pull request #1', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit(
							'Merge t/ckeditor5-link/52 into master',
							'Fix: Foo.'
						);

						return generateChangelog( '0.1.0' );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.1.0' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Bug fixes

* Foo. ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );

			it( 'works with merge commit which is not a pull request #2', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit(
							'Merge branch t/ckedtor5-engine/660 to master',
							'Fix: Foo.'
						);

						return generateChangelog( '0.1.0' );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.1.0' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Bug fixes

* Foo. ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );
		} );

		// See: https://github.com/ckeditor/ckeditor5-dev/issues/271
		describe( 'prefixes for bug fixing', () => {
			it( 'works with prefix "Fixes"', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit( 'Fixes: Foo Bar.' );

						return generateChangelog( '0.0.2' );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.0.2' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Bug fixes

* Foo Bar. ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );

			it( 'works with prefix "Fixed"', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit( 'Fixed: Foo Bar.' );

						return generateChangelog( '0.0.2' );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.0.2' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Bug fixes

* Foo Bar. ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );
		} );

		describe( 'spacing between entries', () => {
			it( 'adds two blank lines for internal release (user specified "internal" version)', () => {
				return makeInitialRelease()
					.then( () => {
						return generateChangelog( '0.1.0', { isInternalRelease: true } );
					} )
					.then( () => {
						const changelogAsArray = getChangelog().split( '\n' ).slice( 0, 9 );

						expect( changelogAsArray[ 0 ], 'Index: 0' ).to.equal( 'Changelog' );
						expect( changelogAsArray[ 1 ], 'Index: 1' ).to.equal( '=========' );
						expect( changelogAsArray[ 2 ], 'Index: 2' ).to.equal( '' );
						expect( replaceDates( changelogAsArray[ 3 ] ), 'Index: 3' ).to.equal(
							'## [0.1.0](https://github.com/ckeditor/ckeditor5-test-package/compare/v0.0.1...v0.1.0) (0000-00-00)'
						);
						expect( changelogAsArray[ 4 ], 'Index: 4' ).to.equal( '' );
						expect( changelogAsArray[ 5 ], 'Index: 5' ).to.equal(
							'Internal changes only (updated dependencies, documentation, etc.).'
						);
						expect( changelogAsArray[ 6 ], 'Index: 6' ).to.equal( '' );
						expect( changelogAsArray[ 7 ], 'Index: 7' ).to.equal( '' );
						expect( replaceDates( changelogAsArray[ 8 ] ), 'Index: 8' ).to.equal(
							'## [0.0.1](https://github.com/ckeditor/ckeditor5-test-package/tree/v0.0.1) (0000-00-00)'
						);
					} );
			} );

			it( 'adds two blank lines for internal release (user provides a version but no commits were made)', () => {
				return makeInitialRelease()
					.then( () => {
						return generateChangelog( '0.1.0', { isInternalRelease: true } );
					} )
					.then( () => {
						const changelogAsArray = getChangelog().split( '\n' ).slice( 0, 9 );

						expect( changelogAsArray[ 0 ], 'Index: 0' ).to.equal( 'Changelog' );
						expect( changelogAsArray[ 1 ], 'Index: 1' ).to.equal( '=========' );
						expect( changelogAsArray[ 2 ], 'Index: 2' ).to.equal( '' );
						expect( replaceDates( changelogAsArray[ 3 ] ), 'Index: 3' ).to.equal(
							'## [0.1.0](https://github.com/ckeditor/ckeditor5-test-package/compare/v0.0.1...v0.1.0) (0000-00-00)'
						);
						expect( changelogAsArray[ 4 ], 'Index: 4' ).to.equal( '' );
						expect( changelogAsArray[ 5 ], 'Index: 5' ).to.equal(
							'Internal changes only (updated dependencies, documentation, etc.).'
						);
						expect( changelogAsArray[ 6 ], 'Index: 6' ).to.equal( '' );
						expect( changelogAsArray[ 7 ], 'Index: 7' ).to.equal( '' );
						expect( replaceDates( changelogAsArray[ 8 ] ), 'Index: 8' ).to.equal(
							'## [0.0.1](https://github.com/ckeditor/ckeditor5-test-package/tree/v0.0.1) (0000-00-00)'
						);
					} );
			} );

			it( 'changelog should contain 2 blank lines for changelog with internal changes', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit( 'Docs: Updated README.' );

						return generateChangelog( '0.0.2' );
					} )
					.then( () => {
						const expectedChangelogeEntries = [
							'## [0.0.2](https://github.com/ckeditor/ckeditor5-test-package/compare/v0.0.1...v0.0.2) (0000-00-00)',
							'',
							'Internal changes only (updated dependencies, documentation, etc.).',
							'',
							'',
							'## [0.0.1](https://github.com/ckeditor/ckeditor5-test-package/tree/v0.0.1) (0000-00-00)'
						];
						const changelogAsArray = replaceDates( getChangelog() ).replace( changelogHeader, '' ).split( '\n' );

						expectedChangelogeEntries.forEach( ( row, index ) => {
							expect( row.trim() ).to.equal( changelogAsArray[ index ].trim(), `Index: ${ index }` );
						} );
					} );
			} );
		} );

		describe( 'additional options', () => {
			it( 'attaches additional description for "Bug fixes" section', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit( 'Fix: Foo Bar.' );

						return generateChangelog( '0.0.2', { additionalNotes: true } );
					} )
					.then( () => {
						const latestChangelog = replaceCommitIds( getChangesForVersion( '0.0.2' ) );

						/* eslint-disable max-len */
						const expectedChangelog = normalizeStrings( `
### Bug fixes

Besides changes in the dependencies, this version also contains the following bug fixes:

* Foo Bar. ([XXXXXXX](https://github.com/ckeditor/ckeditor5-test-package/commit/XXXXXXX))
` );
						/* eslint-enable max-len */

						expect( latestChangelog ).to.equal( expectedChangelog.trim() );
					} );
			} );

			// See: https://github.com/ckeditor/ckeditor5-dev/issues/184
			it( 'forces generating changelog as "internal" even if commits were made', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit(
							'Feature: Issues will not be hoisted. Closes #8.',
							'All details have been described in #1.',
							'NOTE: Please read #1.',
							'BREAKING CHANGES: Some breaking change.'
						);

						makeCommit(
							'Feature: Issues will not be hoisted. Closes #8.',
							'All details have been described in #1.',
							'NOTE: Please read #1.',
							'BREAKING CHANGES: Some breaking change.'
						);

						return generateChangelog( '0.1.0', { isInternalRelease: true } );
					} )
					.then( () => {
						const latestChangelog = getChangesForVersion( '0.1.0' );

						expect( latestChangelog ).to.equal( 'Internal changes only (updated dependencies, documentation, etc.).' );
					} );
			} );

			it( 'does not generate links to commits and release', () => {
				return makeInitialRelease()
					.then( () => {
						makeCommit( 'Feature: Some amazing feature.' );

						return generateChangelog( '0.1.0', { skipLinks: true } );
					} )
					.then( () => {
						const changelogAsArray = getChangelog().split( '\n' ).slice( 0, 10 );

						expect( changelogAsArray[ 0 ], 'Index: 0' ).to.equal( 'Changelog' );
						expect( changelogAsArray[ 1 ], 'Index: 1' ).to.equal( '=========' );
						expect( changelogAsArray[ 2 ], 'Index: 2' ).to.equal( '' );
						expect( replaceDates( changelogAsArray[ 3 ] ), 'Index: 3' ).to.equal(
							'## 0.1.0 (0000-00-00)'
						);
						expect( changelogAsArray[ 4 ], 'Index: 4' ).to.equal( '' );
						expect( changelogAsArray[ 5 ], 'Index: 5' ).to.equal( '### Features' );
						expect( changelogAsArray[ 6 ], 'Index: 6' ).to.equal( '' );
						expect( changelogAsArray[ 7 ], 'Index: 7' ).to.equal(
							'* Some amazing feature.'
						);
						expect( changelogAsArray[ 8 ], 'Index: 8' ).to.equal( '' );
						expect( changelogAsArray[ 9 ], 'Index: 9' ).to.equal( '' );
					} );
			} );
		} );
	} );

	// Because of the Windows end of the line, we need to normalize them.
	// If we won't do it, some of the assertions will fail because strings will be ending with "\r" that wasn't expected.
	function normalizeStrings( content ) {
		return content.replace( /\r\n/g, '\n' );
	}

	function getChangelog() {
		return normalizeStrings( _getChangelog() );
	}

	function getChangesForVersion( version ) {
		return normalizeStrings( _getChangesForVersion( version ) );
	}

	function makeCommit( ...messages ) {
		return exec( 'git commit --allow-empty ' + messages.map( m => `--message "${ m }"` ).join( ' ' ) );
	}

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}

	function generateChangelog( version, options = {} ) {
		const transform = require( '../../../lib/release-tools/utils/transform-commit/transformcommitforsubrepository' );

		return generateChangelogFromCommits( {
			version,
			isInternalRelease: options.isInternalRelease,
			additionalNotes: options.additionalNotes,
			skipLinks: options.skipLinks,
			newTagName: 'v' + version,
			tagName: !options.isFirstRelease ? 'v0.0.1' : null,
			transformCommit: transform
		} );
	}

	// Replaces commits hashes to known string. It allows comparing changelog entries to strings
	// which makes the test easier to read.
	function replaceCommitIds( changelog ) {
		return changelog.replace( /\[[a-z0-9]{7}\]/g, '[XXXXXXX]' )
			.replace( /commit\/[a-z0-9]{7}/g, 'commit/XXXXXXX' );
	}

	// Replaces dates to known string. It allows comparing changelog entries to strings
	// which don't depend on the date.
	function replaceDates( changelog ) {
		return changelog.replace( /\d{4}-\d{2}-\d{2}/g, '0000-00-00' );
	}

	// Almost all testes (except the initial release) require the initial release because we're checking
	// how the changelog looks between releases.
	function makeInitialRelease() {
		makeCommit( 'Internal: An initial commit.' );

		return generateChangelog( '0.0.1', { isFirstRelease: true } )
			.then( () => {
				const version = '0.0.1';

				exec( `npm version ${ version } --no-git-tag-version` );
				exec( 'git add package.json' );
				makeCommit( `Release: v${ version }.` );
				exec( `git tag v${ version }` );
			} );
	}
} );
