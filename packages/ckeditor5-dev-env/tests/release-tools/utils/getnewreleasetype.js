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
const mockery = require( 'mockery' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	let tmpCwd, cwd, getNewReleaseType, sandbox, packageJson, stubs;

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
			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			sandbox = sinon.sandbox.create();

			stubs = {
				transformCommit: sandbox.spy( ( commit ) => {
					if ( commit.type === 'Docs' ) {
						return;
					}

					commit.rawType = commit.type;

					return commit;
				} ),
				versionUtils: {
					getLastFromChangelog: sandbox.stub()
				}
			};

			process.chdir( tmpCwd );

			packageJson = {
				name: 'test-package',
				bugs: 'some-url'
			};

			fs.writeFileSync( path.join( tmpCwd, 'package.json' ), JSON.stringify( packageJson, null, '\t' ) );

			mockery.registerMock( './versions', stubs.versionUtils );

			getNewReleaseType = require( '../../../lib/release-tools/utils/getnewreleasetype' );
		} );

		afterEach( () => {
			process.chdir( cwd );
			sandbox.restore();
			mockery.disable();
		} );

		it( 'throws an error when repository is empty', () => {
			stubs.versionUtils.getLastFromChangelog.returns( null );

			return getNewReleaseType( stubs.transformCommit )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					( err ) => {
						expect( err.message ).to.match( /unknown revision or path not in the working tree/ );
					}
				);
		} );

		it( 'returns "patch" release for non-feature commits', () => {
			stubs.versionUtils.getLastFromChangelog.returns( null );

			exec( `git commit --allow-empty --message "Fix: Some fix."` );
			exec( `git commit --allow-empty --message "Other: Some change."` );

			return getNewReleaseType( stubs.transformCommit )
				.then( ( response ) => {
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'ignores notes from commits which will not be included in changelog', () => {
			stubs.versionUtils.getLastFromChangelog.returns( null );

			exec( `git commit --allow-empty --message "Docs: Nothing." --message "BREAKING CHANGES: It should not bump the major."` );

			return getNewReleaseType( stubs.transformCommit )
				.then( ( response ) => {
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'returns "minor" release for feature commit', () => {
			stubs.versionUtils.getLastFromChangelog.returns( null );

			exec( `git commit --allow-empty --message "Feature: Nothing new."` );

			return getNewReleaseType( stubs.transformCommit )
				.then( ( response ) => {
					expect( response.releaseType ).to.equal( 'minor' );
				} );
		} );

		it( 'returns "major" if any visible in changelog commit has breaking changes', () => {
			stubs.versionUtils.getLastFromChangelog.returns( null );

			exec( `git commit --allow-empty --message "Other: Nothing." --message "BREAKING CHANGES: Bump the major!"` );

			return getNewReleaseType( stubs.transformCommit )
				.then( ( response ) => {
					expect( response.releaseType ).to.equal( 'major' );
				} );
		} );

		it( 'returns "skip" if there are not any "public" commits since the last release', () => {
			stubs.versionUtils.getLastFromChangelog.returns( '1.0.0' );

			exec( `git tag v1.0.0` );

			return getNewReleaseType( stubs.transformCommit )
				.then( ( response ) => {
					exec( `git tag --delete v1.0.0` );

					expect( response.releaseType ).to.equal( 'skip' );
				} );
		} );
	} );

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
} );
