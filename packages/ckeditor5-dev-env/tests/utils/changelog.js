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

describe( 'utils', () => {
	let utils, sandbox;

	describe( 'changelog', () => {
		beforeEach( () => {
			utils = require( '../../lib/utils/changelog' );

			sandbox = sinon.sandbox.create();
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should define constants', () => {
			expect( utils.changelogFile ).to.be.a( 'string' );
			expect( utils.changelogHeader ).to.be.a( 'string' );
		} );

		describe( 'getNewReleaseType', () => {
			it( 'should be defined', () => {
				expect( utils.getNewReleaseType ).to.be.a( 'function' );
			} );
		} );

		describe( 'getCurrentVersion', () => {
			it( 'returns a proper version', () => {
				const cwd = path.join( __dirname, '..', 'fixtures' );

				expect( utils.getCurrentVersion( cwd ) ).to.equal( 'v3.1.2' );
			} );
		} );

		describe( 'getNextVersion', () => {
			it( 'bumps the major', () => {
				expect( utils.getNextVersion( '0.2.3', 'major' ) ).to.equal( '1.0.0' );
			} );

			it( 'bumps the minor', () => {
				expect( utils.getNextVersion( '1.0.10', 'minor' ) ).to.equal( '1.1.0' );
			} );

			it( 'bumps the patch', () => {
				expect( utils.getNextVersion( '3.2.0', 'patch' ) ).to.equal( '3.2.1' );
			} );

			it( 'bumps the version starting with "v"', () => {
				expect( utils.getNextVersion( 'v1.0.0', 'patch' ) ).to.equal( '1.0.1' );
			} );
		} );

		describe( 'getNewVersionType', () => {
			it( 'should bump patch version', () => {
				const commits = [
					{
						notes: [],
						type: 'Enhancement'
					},
					{
						notes: [
							{ title: 'NOTE' }
						],
						type: 'Fix'
					}
				];

				expect( utils.getNewVersionType( commits ) ).to.equal( 2 );
			} );

			it( 'should bump minor version', () => {
				const commits = [
					{
						notes: [],
						type: 'Feature'
					},
					{
						notes: [
							{ title: 'NOTE' }
						],
						type: 'Fix'
					}
				];

				expect( utils.getNewVersionType( commits ) ).to.equal( 1 );
			} );

			it( 'should bump major version', () => {
				const commits = [
					{
						notes: [],
						type: 'Feature'
					},
					{
						notes: [
							{ title: 'BREAKING CHANGE' }
						],
						type: 'Fix'
					}
				];

				expect( utils.getNewVersionType( commits ) ).to.equal( 0 );
			} );
		} );

		describe( 'parseArguments', () => {
			it( 'should return default options', () => {
				expect( utils.parseArguments( [] ) ).to.deep.equal( {
					init: false,
					debug: false
				} );
			} );
		} );

		describe( 'getLatestChangesFromChangelog', () => {
			it( 'returns changes for initial tag', () => {
				const expectedChangelog = [
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))'
				].join( '\n' );

				const changelog = [
					'## 0.1.0 (2017-01-13)\n',
					expectedChangelog
				].join( '\n' );

				const currentChangelogStub = sandbox.stub( utils, 'getCurrentChangelog' )
					.returns( Promise.resolve( utils.changelogHeader + changelog ) );

				return utils.getLatestChangesFromChangelog( 'v0.1.0' )
					.then( ( parsedChangelog ) => {
						expect( currentChangelogStub.calledOnce ).to.equal( true );

						expect( parsedChangelog ).to.equal( expectedChangelog );
					} );
			} );

			it( 'returns changes between tags', () => {
				const expectedChangelog = [
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))\n',
					'### BREAKING CHANGE',
					'* Bump the major!',
				].join( '\n' );

				const changelog = [
					'## [1.0.0](https://github.com/) (2017-01-13)',
					'',
					expectedChangelog,
					'\n',
					'## 0.1.0 (2017-01-13)',
					'',
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))'
				].join( '\n' );

				const currentChangelogStub = sandbox.stub( utils, 'getCurrentChangelog' )
					.returns( Promise.resolve( utils.changelogHeader + changelog ) );

				return utils.getLatestChangesFromChangelog( 'v1.0.0', 'v0.1.0' )
					.then( ( parsedChangelog ) => {
						expect( currentChangelogStub.calledOnce ).to.equal( true );

						expect( parsedChangelog ).to.equal( expectedChangelog );
					} );
			} );
		} );

		describe( 'getCurrentChangelog', () => {
			it( 'resolves the changelog', () => {
				const resolveStub = sandbox.stub( path, 'resolve' ).returns( 'path-to-changelog' );

				const readFileStub = sandbox.stub( fs, 'readFile', ( fileName, encode, callback ) => {
					callback( null, 'Content.' );
				} );

				return utils.getCurrentChangelog()
					.then( ( changelog ) => {
						expect( resolveStub.calledOnce ).to.equal( true );
						expect( readFileStub.calledOnce ).to.equal( true );
						expect( readFileStub.firstCall.args[ 0 ] ).to.equal( 'path-to-changelog' );
						expect( readFileStub.firstCall.args[ 1 ] ).to.equal( 'utf-8' );
						expect( changelog ).to.equal( 'Content.' );
					} );
			} );

			it( 'rejects when something went wrong', () => {
				const error = new Error( 'Something went wrong.' );

				const resolveStub = sandbox.stub( path, 'resolve' ).returns( 'path-to-changelog' );

				const readFileStub = sandbox.stub( fs, 'readFile', ( fileName, encode, callback ) => {
					callback( error );
				} );

				return utils.getCurrentChangelog()
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						( err ) => {
							expect( resolveStub.calledOnce ).to.equal( true );
							expect( readFileStub.calledOnce ).to.equal( true );
							expect( err ).to.equal( error );
						}
					);
			} );
		} );

		describe( 'saveChangelog', () => {
			it( 'resolves the promise', () => {
				const resolveStub = sandbox.stub( path, 'resolve' ).returns( 'path-to-changelog' );

				const writeFileStub = sandbox.stub( fs, 'writeFile', ( fileName, content, callback ) => {
					callback( null );
				} );

				return utils.saveChangelog( 'New content.' )
					.then( () => {
						expect( resolveStub.calledOnce ).to.equal( true );
						expect( writeFileStub.calledOnce ).to.equal( true );
						expect( writeFileStub.firstCall.args[ 0 ] ).to.equal( 'path-to-changelog' );
						expect( writeFileStub.firstCall.args[ 1 ] ).to.equal( 'New content.' );
					} );
			} );

			it( 'rejects when something went wrong', () => {
				const error = new Error( 'Something went wrong.' );

				const resolveStub = sandbox.stub( path, 'resolve' ).returns( 'path-to-changelog' );

				const writeFileStub = sandbox.stub( fs, 'writeFile', ( fileName, content, callback ) => {
					callback( error );
				} );

				return utils.saveChangelog()
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						( err ) => {
							expect( resolveStub.calledOnce ).to.equal( true );
							expect( writeFileStub.calledOnce ).to.equal( true );
							expect( err ).to.equal( error );
						}
					);
			} );
		} );

		describe( 'createGithubRelease', () => {
			it( 'should be defined', () => {
				expect( utils.createGithubRelease ).to.be.a( 'function' );
			} );
		} );
	} );
} );
