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
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	let tmpCwd, cwd, getNewReleaseType, sandbox, packageJson, stubs;

	describe( 'getNewReleaseType()', () => {
		before( () => {
			cwd = process.cwd();
			tmpCwd = fs.mkdtempSync( __dirname + path.sep );
		} );

		after( () => {
			exec( `rm -rf ${ tmpCwd }` );
		} );

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				transformCommit: sandbox.stub().callsFake( commit => {
					commit.rawType = commit.type;

					return commit;
				} ),
				versionUtils: {
					getLastFromChangelog: sandbox.stub()
				}
			};

			process.chdir( tmpCwd );

			exec( 'git init' );

			if ( process.env.CI ) {
				exec( 'git config user.email "ckeditor5@ckeditor.com"' );
				exec( 'git config user.name "CKEditor5 CI"' );
			}

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
			exec( `rm -rf ${ path.join( tmpCwd, '.git' ) }` );

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

		it( 'returns "skip" release for invalid commits', () => {
			exec( 'git commit --allow-empty --message "Foo Bar."' );
			exec( 'git commit --allow-empty --message "Foo Bar even more..."' );

			stubs.transformCommit.returns( undefined );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'skip' );
					expect( response.commits ).to.be.an( 'Array' );
					expect( response.commits.length ).to.equal( 0 );
				} );
		} );

		it( 'returns "patch" release for non-feature commits', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Other: Some change."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'patch' );
					expect( response.commits.length ).to.equal( 2 );
				} );
		} );

		it( 'ignores notes from commits which will not be included in changelog (MAJOR BREAKING CHANGES)', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Docs: Nothing." --message "MAJOR BREAKING CHANGES: It should not bump the major."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'patch' );
					expect( response.commits.length ).to.equal( 2 );
				} );
		} );

		it( 'ignores notes from commits which will not be included in changelog (MINOR BREAKING CHANGES)', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Docs: Nothing." --message "MINOR BREAKING CHANGES: It should not bump the major."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'patch' );
					expect( response.commits.length ).to.equal( 2 );
				} );
		} );

		it( 'returns "minor" release for feature commit', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Feature: Nothing new."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'minor' );
					expect( response.commits.length ).to.equal( 2 );
				} );
		} );

		it( 'returns "major" if any visible in changelog commit has breaking changes', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Feature: Nothing new."' );
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "MAJOR BREAKING CHANGES: Bump the major!"' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'major' );
					expect( response.commits.length ).to.equal( 3 );
				} );
		} );

		it( 'returns "major" even if "MINOR BREAKING CHANGE" was found first', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Feature: Nothing new." --message "MINOR BREAKING CHANGES: Bump the minor!"' );
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "MAJOR BREAKING CHANGES: Bump the major!"' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'major' );
					expect( response.commits.length ).to.equal( 3 );
				} );
		} );

		it( 'returns "minor" when found "MINOR BREAKING CHANGES" in features commits', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git commit --allow-empty --message "Feature: Nothing new." --message "MINOR BREAKING CHANGES: Bump the minor!"' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'minor' );
					expect( response.commits.length ).to.equal( 2 );
				} );
		} );

		it( 'returns "minor" when found "MINOR BREAKING CHANGES" in fixes commits', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix." --message "MINOR BREAKING CHANGES: Bump the minor!"' );
			exec( 'git commit --allow-empty --message "Fix: Some other fix." --message "MINOR BREAKING CHANGES: Moved utils outside."' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'minor' );
					expect( response.commits.length ).to.equal( 2 );
				} );
		} );

		it( 'returns "minor" when found "MINOR BREAKING CHANGES" in "Other" commits', () => {
			exec( 'git commit --allow-empty --message "Other: Updated whatever." --message "MINOR BREAKING CHANGES: Bump the minor!"' );

			return getNewReleaseType( stubs.transformCommit )
				.then( response => {
					expect( response.releaseType ).to.equal( 'minor' );
					expect( response.commits.length ).to.equal( 1 );
				} );
		} );

		it( 'returns "skip" if there is no commit since the last release', () => {
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "MAJOR BREAKING CHANGES: Bump the major!"' );
			exec( 'git tag v1.0.0' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.0.0' } )
				.then( response => {
					expect( response.releaseType ).to.equal( 'skip' );
					expect( response.commits.length ).to.equal( 0 );
				} );
		} );

		it( 'returns "internal" release for internal commits since the last release', () => {
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );
			exec( 'git tag v1.0.0' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #1."' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #2."' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #3."' );

			return getNewReleaseType( stubs.transformCommit, { tagName: 'v1.0.0' } )
				.then( response => {
					expect( response.releaseType ).to.equal( 'internal' );
					expect( response.commits.length ).to.equal( 3 );
				} );
		} );

		it( 'transforms each commit since the last release', () => {
			exec( 'git commit --allow-empty --message "Feature: Nothing new."' );
			exec( 'git commit --allow-empty --message "Other: Nothing." --message "MAJOR BREAKING CHANGES: Bump the major!"' );
			exec( 'git tag v1.0.0' );
			exec( 'git commit --allow-empty --message "Docs: Added some notes to README #1."' );
			exec( 'git commit --allow-empty --message "Other: Nothing."' );
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
			exec( 'git commit --allow-empty --message "Fix: Some fix."' );

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
