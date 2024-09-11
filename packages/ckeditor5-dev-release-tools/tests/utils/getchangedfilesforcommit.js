/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import getChangedFilesForCommit from '../../lib/utils/getchangedfilesforcommit.js';

describe( 'dev-release-tools/utils', () => {
	let tmpCwd, cwd;

	describe( 'getChangedFilesForCommit()', { timeout: 15000 }, function() {
		beforeAll( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( path.join( __dirname, '..', 'test-fixtures' ) + path.sep );
			process.chdir( tmpCwd );
		} );

		afterAll( () => {
			process.chdir( cwd );
			fs.rmdirSync( tmpCwd );
		} );

		beforeEach( () => {
			exec( 'git init' );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}
		} );

		afterEach( () => {
			fs.rmSync( path.join( tmpCwd, '.git' ), { recursive: true } );
			fs.readdirSync( tmpCwd ).forEach( file => fs.unlinkSync( file ) );
		} );

		it( 'returns files for initial commit', () => {
			fs.writeFileSync( '1.txt', '' );
			fs.writeFileSync( '2.txt', '' );
			fs.writeFileSync( '3.txt', '' );
			fs.writeFileSync( '4.txt', '' );
			fs.writeFileSync( '5.txt', '' );
			exec( 'git add *.txt' );
			exec( 'git commit -m "Initial commit."' );

			const files = getChangedFilesForCommit( getLastCommit() );

			expect( files ).toEqual( [
				'1.txt',
				'2.txt',
				'3.txt',
				'4.txt',
				'5.txt'
			] );
		} );

		it( 'returns files for next commit after initial', () => {
			fs.writeFileSync( '1.txt', '' );
			fs.writeFileSync( '2.txt', '' );
			fs.writeFileSync( '3.txt', '' );
			fs.writeFileSync( '4.txt', '' );
			fs.writeFileSync( '5.txt', '' );
			exec( 'git add *.txt' );
			exec( 'git commit -m "Initial commit."' );

			fs.writeFileSync( '2.js', '' );
			fs.writeFileSync( '3.js', '' );
			fs.writeFileSync( '4.js', '' );
			exec( 'git add *.js' );
			exec( 'git commit -m "Next commit after initial."' );

			const files = getChangedFilesForCommit( getLastCommit() );

			expect( files ).toEqual( [
				'2.js',
				'3.js',
				'4.js'
			] );
		} );

		it( 'returns files for commit on new branch', () => {
			fs.writeFileSync( '1.txt', '' );
			fs.writeFileSync( '2.txt', '' );
			fs.writeFileSync( '3.txt', '' );
			fs.writeFileSync( '4.txt', '' );
			fs.writeFileSync( '5.txt', '' );
			exec( 'git add *.txt' );
			exec( 'git commit -m "Initial commit."' );

			fs.writeFileSync( '2.js', '' );
			fs.writeFileSync( '3.js', '' );
			fs.writeFileSync( '4.js', '' );
			exec( 'git add *.js' );
			exec( 'git commit -m "Next commit after initial."' );

			exec( 'git checkout -b develop' );
			fs.writeFileSync( '5.json', '' );
			fs.writeFileSync( '6.json', '' );
			exec( 'git add *.json' );
			exec( 'git commit -m "New commit on branch develop."' );

			const files = getChangedFilesForCommit( getLastCommit() );

			expect( files ).toEqual( [
				'5.json',
				'6.json'
			] );
		} );

		it( 'returns files for merge commit', () => {
			fs.writeFileSync( '1.txt', '' );
			fs.writeFileSync( '2.txt', '' );
			fs.writeFileSync( '3.txt', '' );
			fs.writeFileSync( '4.txt', '' );
			fs.writeFileSync( '5.txt', '' );
			exec( 'git add *.txt' );
			exec( 'git commit -m "Initial commit."' );

			fs.writeFileSync( '2.js', '' );
			fs.writeFileSync( '3.js', '' );
			fs.writeFileSync( '4.js', '' );
			exec( 'git add *.js' );
			exec( 'git commit -m "Next commit after initial."' );

			exec( 'git checkout -b develop' );
			fs.writeFileSync( '5.json', '' );
			fs.writeFileSync( '6.json', '' );
			exec( 'git add *.json' );
			exec( 'git commit -m "New commit on branch develop."' );

			exec( 'git checkout master' );
			fs.writeFileSync( '10.sh', '' );
			fs.writeFileSync( '11.sh', '' );
			fs.writeFileSync( '12.sh', '' );
			exec( 'git add *.sh' );
			exec( 'git commit -m "New commit on branch master."' );

			exec( 'git merge develop' );
			exec( 'git branch -d develop' );

			const files = getChangedFilesForCommit( getLastCommit() );

			expect( files ).toEqual( [
				'5.json',
				'6.json'
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
