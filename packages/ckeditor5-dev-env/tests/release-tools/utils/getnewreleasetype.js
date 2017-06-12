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
			sandbox = sinon.sandbox.create();

			stubs = {
				transformCommit: sandbox.spy( commit => {
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

			getNewReleaseType = proxyquire( '../../../lib/release-tools/utils/getnewreleasetype', {
				'./versions': stubs.versionUtils
			} );
		} );

		afterEach( () => {
			process.chdir( cwd );
			sandbox.restore();
		} );

		it( 'throws an error when repository is empty', () => {
			return getNewReleaseType( stubs.transformCommit )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					err => {
						expect( err.message ).to.equal( 'Given repository is empty.' );
					}
				);
		} );

		it( 'returns "patch" release for non-feature commits', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Other: Some change."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'ignores notes from commits which will not be included in changelog', () => {
			exec( 'git commit --allow-empty --message "Docs: Nothing." --message "BREAKING CHANGES: It should not bump the major."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'returns "minor" release for feature commit', () => {
			exec( 'git commit --allow-empty --message "Feature: Nothing new."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'minor' );
				} );
		} );

		it( 'returns "major" if any visible in changelog commit has breaking changes', () => {
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "BREAKING CHANGES: Bump the major!"' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'major' );
				} );
		} );

		it( 'returns "skip" if there are not any "public" commits since the last release', () => {
			exec( 'git tag v1.0.0' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.0.0' } )
				.then( response => {
					expect( response.releaseType ).to.equal( 'skip' );
				} );
		} );

		it( 'returns "patch" release for internal commits since the last release', () => {
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #1."' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.0.0' } )
				.then( response => {
					expect( response.releaseType ).to.equal( 'patch' );
				} );
		} );

		it( 'transforms each commit since the last release', () => {
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "BREAKING CHANGES: Bump the major!"' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #2."' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.0.0' } )
				.then( () => {
					// transformCommit should be called for commits:
					// (1) Docs: Added some notes to README #1.
					// (2) Other: Nothing.
					// (3) Docs: Added some notes to README #2.
					expect( stubs.transformCommit.calledThrice ).to.equal( true );
				} );
		} );

		it( 'throws an error when given tag does not exist', () => {
			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.1.2' } )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					err => {
						const message = 'Cannot find tag "v1.1.2" (the latest version' +
							' from the changelog) in given repository.';
						expect( err.message ).to.equal( message );
					}
				);
		} );
	} );

	function exec( command ) {
		return tools.shExec( command, { verbosity: 'error' } );
	}
} );
