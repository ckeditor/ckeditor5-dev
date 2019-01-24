/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils/transform-commit', () => {
	let tmpCwd, cwd, getChangedFilesForCommit;

	describe( 'getChangedFilesForCommit()', function() {
		this.timeout( 15 * 1000 );

		before( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( __dirname + path.sep );
			process.chdir( tmpCwd );
		} );

		after( () => {
			exec( `rm -rf ${ tmpCwd }` );
			process.chdir( cwd );
		} );

		beforeEach( () => {
			exec( 'git init' );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}
		} );

		afterEach( () => {
			exec( `rm -rf ${ path.join( tmpCwd, '.git' ) }` );
			exec( `rm -rf ${ path.join( tmpCwd, '*' ) }` );
		} );

		beforeEach( () => {
			getChangedFilesForCommit = require( '../../../../lib/release-tools/utils/transform-commit/getchangedfilesforcommit' );
		} );

		it( 'returns files for initial commit', () => {
			exec( 'touch 1.txt' );
			exec( 'touch 2.txt' );
			exec( 'touch 3.txt' );
			exec( 'touch 4.txt' );
			exec( 'touch 5.txt' );
			exec( 'git add *.txt' );
			exec( 'git commit -m "Initial commit."' );

			const files = getChangedFilesForCommit( getLastCommit() );

			expect( files ).to.deep.equal( [
				'1.txt',
				'2.txt',
				'3.txt',
				'4.txt',
				'5.txt',
			] );
		} );

		it( 'returns files for next commit after initial', () => {
			exec( 'touch 1.txt' );
			exec( 'touch 2.txt' );
			exec( 'touch 3.txt' );
			exec( 'touch 4.txt' );
			exec( 'touch 5.txt' );
			exec( 'git add *.txt' );
			exec( 'git commit -m "Initial commit."' );

			exec( 'touch 2.js' );
			exec( 'touch 3.js' );
			exec( 'touch 4.js' );
			exec( 'git add *.js' );
			exec( 'git commit -m "Next commit after initial."' );

			const files = getChangedFilesForCommit( getLastCommit() );

			expect( files ).to.deep.equal( [
				'2.js',
				'3.js',
				'4.js',
			] );
		} );

		it( 'returns files for commit on new branch', () => {
			exec( 'touch 1.txt' );
			exec( 'touch 2.txt' );
			exec( 'touch 3.txt' );
			exec( 'touch 4.txt' );
			exec( 'touch 5.txt' );
			exec( 'git add *.txt' );
			exec( 'git commit -m "Initial commit."' );

			exec( 'touch 2.js' );
			exec( 'touch 3.js' );
			exec( 'touch 4.js' );
			exec( 'git add *.js' );
			exec( 'git commit -m "Next commit after initial."' );

			exec( 'git checkout -b develop' );
			exec( 'touch 5.json' );
			exec( 'touch 6.json' );
			exec( 'git add *.json' );
			exec( 'git commit -m "New commit on branch develop."' );

			const files = getChangedFilesForCommit( getLastCommit() );

			expect( files ).to.deep.equal( [
				'5.json',
				'6.json',
			] );
		} );

		it( 'returns files for merge commit', () => {
			exec( 'touch 1.txt' );
			exec( 'touch 2.txt' );
			exec( 'touch 3.txt' );
			exec( 'touch 4.txt' );
			exec( 'touch 5.txt' );
			exec( 'git add *.txt' );
			exec( 'git commit -m "Initial commit."' );

			exec( 'touch 2.js' );
			exec( 'touch 3.js' );
			exec( 'touch 4.js' );
			exec( 'git add *.js' );
			exec( 'git commit -m "Next commit after initial."' );

			exec( 'git checkout -b develop' );
			exec( 'touch 5.json' );
			exec( 'touch 6.json' );
			exec( 'git add *.json' );
			exec( 'git commit -m "New commit on branch develop."' );

			exec( 'git checkout master' );
			exec( 'touch 10.sh' );
			exec( 'touch 11.sh' );
			exec( 'touch 12.sh' );
			exec( 'git add *.sh' );
			exec( 'git commit -m "New commit on branch master."' );

			exec( 'git merge develop' );
			exec( 'git branch -d develop' );

			const files = getChangedFilesForCommit( getLastCommit() );

			expect( files ).to.deep.equal( [
				'5.json',
				'6.json',
			] );
		} );
	} );

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}

	function getLastCommit() {
		return exec( 'git log -n 1 --pretty=format:"%H"' ).trim();
	}
} );
