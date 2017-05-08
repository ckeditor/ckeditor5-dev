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
const { changelogHeader, getChangelog } = require( '../../../lib/release-tools/utils/changelog' );

describe( 'dev-env/release-tools/utils', () => {
	let tmpCwd, cwd;

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
		} );

		it( 'generates a changelog for the first time', () => {
			exec( 'git commit --allow-empty --message "Internal: An initial commit."' );

			return generateChangelog( '0.0.1' )
				.then( () => {
					const changelog = getChangelog();

					expect( changelog ).to.contain( changelogHeader );
					expect( changelog ).to.contain( 'Internal changes only (updated dependencies, documentation, etc.).' );

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
					const changelog = getChangelog();
					const url = 'https://github.com/ckeditor/ckeditor5-test-package';

					//jscs:disable maximumLineLength
					expect( changelog ).to.match( new RegExp( `\\* Another feature. Closes \\[#2\\]\\(${ url }\\/issues\\/2\\). \\(\\[[a-z0-9]{7}\\]\\(${ url }\\/commit\\/[a-z0-9]{7}\\)\\)` ) );
					expect( changelog ).to.match( new RegExp( `  This PR also closes \\[#3\\]\\(${ url }\\/issues\\/3\\) and \\[#4\\]\\(${ url }\\/issues\\/4\\).` ) );
					//jscs:enable maximumLineLength

					release( '0.2.0' );
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
} );
