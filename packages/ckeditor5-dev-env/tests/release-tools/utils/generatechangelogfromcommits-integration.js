/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const generateChangelogFromCommits = require( '../../../lib/release-tools/utils/generatechangelogfromcommits' );
const { changelogHeader, getChangelog, getChangesForVersion } = require( '../../../lib/release-tools/utils/changelog' );

describe( 'dev-env/release-tools/utils', () => {
	let tmpCwd, cwd;

	// Those tests create a chain of releases.
	describe( 'generateChangelogFromCommits() - integration test', () => {
		before( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( __dirname + path.sep );
			process.chdir( tmpCwd );

			exec( `git init` );

			if ( process.env.CI ) {
				exec( `git config user.email "ckeditor5@ckeditor.com"` );
				exec( `git config user.name "CKEditor5 CI"` );
			}

			const packageJson = {
				name: '@ckeditor/ckeditor5-test-package',
				bugs: 'https://github.com/ckeditor/ckeditor5-test-package/issues',
				repository: 'https://github.com/ckeditor/ckeditor5-test-package'
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

		it( 'generates a changelog for the first time', () => {
			exec( 'git commit --allow-empty --message "Internal: An initial commit."' );

			return generateChangelog( '0.0.1' )
				.then( () => {
					expect( getChangelog() ).to.contain( changelogHeader );
					expect( getChangesForVersion( '0.0.1' ) ).to.contain( 'Internal changes only (updated dependencies, documentation, etc.).' );

					release( '0.0.1' );
				} );
		} );

		it( 'title of the next release should be a link which compares current version with the previous one', () => {
			exec( 'git commit --allow-empty --message "Feature: Some amazing feature. Closes #1."' );

			return generateChangelog( '0.1.0', '0.0.1' )
				.then( () => {
					const expectedTitle = '## [0.1.0](https://github.com/ckeditor/ckeditor5-test-package/compare/v0.0.1...v0.1.0)';

					expect( getChangelog() ).to.contain( expectedTitle );

					release( '0.1.0' );
				} );
		} );

		it( 'does not hoist issues from the commit body', () => {
			exec( 'git commit --allow-empty ' +
				'--message "Feature: Another feature. Closes #2." ' +
				'--message "This PR also closes #3 and #4."' );

			return generateChangelog( '0.2.0', '0.1.0' )
				.then( () => {
					const url = 'https://github.com/ckeditor/ckeditor5-test-package';
					const latestChangelog = replaceCommitIds( getChangesForVersion( '0.2.0' ) );

					expect( latestChangelog.split( '\n' ).length ).to.equal( 5 );

					const changesAsArray = latestChangelog.split( '\n' ).filter( ( line ) => line.trim().length );

					//jscs:disable maximumLineLength
					expect( changesAsArray[ 0 ] ).to.equal( '### Features' );
					expect( changesAsArray[ 1 ] ).to.equal( `* Another feature. Closes [#2](${ url }/issues/2). ([XXXXXXX](${ url }/commit/XXXXXXX))` );
					expect( changesAsArray[ 2 ] ).to.equal( `  This PR also closes [#3](${ url }/issues/3) and [#4](${ url }/issues/4).` );
					//jscs:enable maximumLineLength

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
					const url = 'https://github.com/ckeditor/ckeditor5-test-package';
					const latestChangelog = replaceCommitIds( getChangesForVersion( '0.2.1' ) );

					expect( latestChangelog.split( '\n' ).length ).to.equal( 5 );

					const changesAsArray = latestChangelog.split( '\n' ).filter( ( line ) => line.trim().length );

					//jscs:disable maximumLineLength
					expect( changesAsArray[ 0 ] ).to.equal( '### Bug fixes' );
					expect( changesAsArray[ 1 ] ).to.equal( `* Amazing fix. Closes [#5](${ url }/issues/5). ([XXXXXXX](${ url }/commit/XXXXXXX))` );
					expect( changesAsArray[ 2 ] ).to.equal( `  The PR also finally closes [#3](${ url }/issues/3) and [#4](${ url }/issues/4). So good!` );
					//jscs:enable maximumLineLength

					release( '0.2.1' );
				} );
		} );
	} );

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}

	function generateChangelog( version, previousVersion = null ) {
		return generateChangelogFromCommits( {
			version,
			newTagName: 'v' + version,
			tagName: previousVersion ? 'v' + previousVersion : null,
			transformCommit: require( '../../../lib/release-tools/utils/transform-commit/transformcommitforsubrepository' )
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
} );
