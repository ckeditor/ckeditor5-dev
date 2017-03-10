/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	let tmpCwd, cwd, getNewReleaseType, sandbox, packageJson;

	describe( 'getNewReleaseType()', () => {
		before( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( __dirname + path.sep );
			exec( `cd ${ tmpCwd } && git init` );

			if ( process.env.CI ) {
				exec( `cd ${ tmpCwd } && git config user.email "ckeditor5@ckeditor.com"` );
				exec( `cd ${ tmpCwd } && git config user.name "CKEditor5 CI"` );
			}
		} );

		after( () => {
			exec( `rm -rf ${ tmpCwd }` );
		} );

		beforeEach( () => {
			getNewReleaseType = require( '../../../lib/release-tools/utils/getnewreleasetype' );

			sandbox = sinon.sandbox.create();

			process.chdir( tmpCwd );

			packageJson = {
				name: 'test-package',
				bugs: 'some-url'
			};

			fs.writeFileSync( path.join( tmpCwd, 'package.json' ), JSON.stringify( packageJson, null, '\t' ) );
		} );

		afterEach( () => {
			process.chdir( cwd );
			sandbox.restore();
		} );

		it( 'throws an error when repository is empty', () => {
			return getNewReleaseType()
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					( err ) => {
						expect( err.message ).to.match( /Command failed: git log/ );
					}
				);
		} );

		it( 'returns "patch" release for non-feature commits', () => {
			exec( `git commit --allow-empty --message "Fix: Some fix."` );
			exec( `git commit --allow-empty --message "Other: Some change."` );

			return getNewReleaseType()
				.then( ( response ) => {
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'ignores notes from commits which will not be included in changelog', () => {
			exec( `git commit --allow-empty --message "Docs: Nothing.\n\nBREAKING CHANGES: It should not bump the major."` );

			return getNewReleaseType()
				.then( ( response ) => {
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'returns "minor" release for feature commit', () => {
			exec( `git commit --allow-empty --message "Feature: Nothing new."` );

			return getNewReleaseType()
				.then( ( response ) => {
					expect( response.releaseType ).to.equal( 'minor' );
				} );
		} );

		it( 'returns "major" if any visible in changelog commit has breaking changes', () => {
			exec( `git commit --allow-empty --message "Other: Nothing.\n\nBREAKING CHANGE: Bump the major!"` );

			return getNewReleaseType()
				.then( ( response ) => {
					expect( response.releaseType ).to.equal( 'major' );
				} );
		} );
	} );

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
} );
