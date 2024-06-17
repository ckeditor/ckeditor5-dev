/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-release-tools/utils', () => {
	let version, sandbox, changelogStub, getPackageJsonStub;

	describe( 'versions', () => {
		beforeEach( () => {
			sandbox = sinon.createSandbox();

			changelogStub = sandbox.stub();
			getPackageJsonStub = sandbox.stub();

			version = proxyquire( '../../lib/utils/versions', {
				'@ckeditor/ckeditor5-dev-utils': {
					tools
				},
				'./getpackagejson': getPackageJsonStub,
				'./changelog': {
					getChangelog: changelogStub
				}
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		describe( 'getLastFromChangelog()', () => {
			it( 'returns null if the changelog is invalid', () => {
				changelogStub.returns( 'Example changelog.' );

				expect( version.getLastFromChangelog() ).to.equal( null );
			} );

			it( 'returns version from changelog #1', () => {
				changelogStub.returns( '\n## [1.0.0](...) (2017-04-05)\nSome changelog entry.\n\n## 0.0.1' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0' );
			} );

			it( 'returns version from changelog #2', () => {
				changelogStub.returns( '\n## 1.0.0 (2017-04-05)\nSome changelog entry.' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0' );
			} );

			it( 'returns version from changelog #3', () => {
				changelogStub.returns( '\n## [1.0.0-alpha](...) (2017-04-05)\nSome changelog entry.\n\n## 0.0.1' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0-alpha' );
			} );

			it( 'returns version from changelog #4', () => {
				changelogStub.returns( '\n## 1.0.0-alpha (2017-04-05)\nSome changelog entry.' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0-alpha' );
			} );

			it( 'returns version from changelog #5', () => {
				changelogStub.returns( '\n## [1.0.0-alpha+001](...) (2017-04-05)\nSome changelog entry.\n\n## 0.0.1' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0-alpha+001' );
			} );

			it( 'returns version from changelog #6', () => {
				changelogStub.returns( '\n## 1.0.0-alpha+001 (2017-04-05)\nSome changelog entry.' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0-alpha+001' );
			} );

			it( 'returns version from changelog #7', () => {
				changelogStub.returns( '\n## [1.0.0-beta.2](...) (2017-04-05)\nSome changelog entry.\n\n## 0.0.1' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0-beta.2' );
			} );

			it( 'returns version from changelog #8', () => {
				changelogStub.returns( '\n## 1.0.0-beta.2 (2017-04-05)\nSome changelog entry.' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0-beta.2' );
			} );

			it( 'returns version from changelog #9', () => {
				changelogStub.returns( '\n## 1.0.0\nSome changelog entry.' );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0' );
			} );

			it( 'returns null for empty changelog', () => {
				changelogStub.returns( '' );

				expect( version.getLastFromChangelog() ).to.equal( null );
			} );

			it( 'returns null if changelog does not exist', () => {
				changelogStub.returns( null );

				expect( version.getLastFromChangelog() ).to.equal( null );
			} );
		} );

		describe( 'getLastPreRelease()', () => {
			let shExecStub;

			beforeEach( () => {
				shExecStub = sandbox.stub( tools, 'shExec' );
				getPackageJsonStub.returns( { name: 'ckeditor5' } );
			} );

			it( 'asks npm for all versions of a package', () => {
				shExecStub.resolves( JSON.stringify( [] ) );

				return version.getLastPreRelease( '42.0.0-alpha' )
					.then( () => {
						expect( shExecStub.callCount ).to.equal( 1 );
						expect( shExecStub.firstCall.args[ 0 ] ).to.equal( 'npm view ckeditor5 versions --json' );
					} );
			} );

			it( 'returns null if there is no version for a package', () => {
				shExecStub.rejects();

				return version.getLastPreRelease( '42.0.0-alpha' )
					.then( result => {
						expect( result ).to.equal( null );
					} );
			} );

			it( 'returns null if there is no pre-release version matching the release identifier', () => {
				shExecStub.resolves( JSON.stringify( [
					'0.0.0-nightly-20230615.0',
					'37.0.0-alpha.0',
					'37.0.0-alpha.1',
					'41.0.0',
					'42.0.0'
				] ) );

				return version.getLastPreRelease( '42.0.0-alpha' )
					.then( result => {
						expect( result ).to.equal( null );
					} );
			} );

			it( 'returns last pre-release version matching the release identifier', () => {
				shExecStub.resolves( JSON.stringify( [
					'0.0.0-nightly-20230615.0',
					'37.0.0-alpha.0',
					'37.0.0-alpha.1',
					'41.0.0',
					'42.0.0'
				] ) );

				return version.getLastPreRelease( '37.0.0-alpha' )
					.then( result => {
						expect( result ).to.equal( '37.0.0-alpha.1' );
					} );
			} );

			it( 'returns last pre-release version matching the release identifier (non-chronological versions order)', () => {
				shExecStub.resolves( JSON.stringify( [
					'0.0.0-nightly-20230615.0',
					'37.0.0-alpha.0',
					'37.0.0-alpha.2',
					'41.0.0',
					'42.0.0',
					'37.0.0-alpha.1'
				] ) );

				return version.getLastPreRelease( '37.0.0-alpha' )
					.then( result => {
						expect( result ).to.equal( '37.0.0-alpha.2' );
					} );
			} );

			it( 'returns last pre-release version matching the release identifier (sequence numbers greater than 10)', () => {
				shExecStub.resolves( JSON.stringify( [
					'0.0.0-nightly-20230615.0',
					'37.0.0-alpha.1',
					'37.0.0-alpha.2',
					'37.0.0-alpha.3',
					'41.0.0',
					'37.0.0-alpha.10',
					'37.0.0-alpha.11'
				] ) );

				return version.getLastPreRelease( '37.0.0-alpha' )
					.then( result => {
						expect( result ).to.equal( '37.0.0-alpha.11' );
					} );
			} );

			it( 'returns last nightly version', () => {
				shExecStub.resolves( JSON.stringify( [
					'0.0.0-nightly-20230614.0',
					'0.0.0-nightly-20230615.0',
					'0.0.0-nightly-20230615.1',
					'0.0.0-nightly-20230615.2',
					'0.0.0-nightly-20230616.0',
					'37.0.0-alpha.0',
					'37.0.0-alpha.2',
					'41.0.0',
					'42.0.0'
				] ) );

				return version.getLastPreRelease( '0.0.0-nightly' )
					.then( result => {
						expect( result ).to.equal( '0.0.0-nightly-20230616.0' );
					} );
			} );

			it( 'returns last nightly version from a specified day', () => {
				shExecStub.resolves( JSON.stringify( [
					'0.0.0-nightly-20230614.0',
					'0.0.0-nightly-20230615.0',
					'0.0.0-nightly-20230615.1',
					'0.0.0-nightly-20230615.2',
					'0.0.0-nightly-20230616.0',
					'37.0.0-alpha.0',
					'37.0.0-alpha.2',
					'41.0.0',
					'42.0.0'
				] ) );

				return version.getLastPreRelease( '0.0.0-nightly-20230615' )
					.then( result => {
						expect( result ).to.equal( '0.0.0-nightly-20230615.2' );
					} );
			} );
		} );

		describe( 'getLastNightly()', () => {
			beforeEach( () => {
				sandbox.stub( version, 'getLastPreRelease' ).resolves( '0.0.0-nightly-20230615.0' );
			} );

			it( 'asks for a last nightly pre-release version', () => {
				return version.getLastNightly()
					.then( result => {
						expect( version.getLastPreRelease.callCount ).to.equal( 1 );
						expect( version.getLastPreRelease.firstCall.args[ 0 ] ).to.equal( '0.0.0-nightly' );

						expect( result ).to.equal( '0.0.0-nightly-20230615.0' );
					} );
			} );
		} );

		describe( 'getNextPreRelease()', () => {
			it( 'asks for a last pre-release version', () => {
				sandbox.stub( version, 'getLastPreRelease' ).resolves( null );

				return version.getNextPreRelease( '42.0.0-alpha' )
					.then( () => {
						expect( version.getLastPreRelease.calledOnce ).to.equal( true );
						expect( version.getLastPreRelease.firstCall.args[ 0 ] ).to.equal( '42.0.0-alpha' );
					} );
			} );

			it( 'returns pre-release version with id = 0 if pre-release version was never published for the package yet', () => {
				sandbox.stub( version, 'getLastPreRelease' ).resolves( null );

				return version.getNextPreRelease( '42.0.0-alpha' )
					.then( result => {
						expect( result ).to.equal( '42.0.0-alpha.0' );
					} );
			} );

			it( 'returns pre-release version with incremented id if older pre-release version was already published', () => {
				sandbox.stub( version, 'getLastPreRelease' ).resolves( '42.0.0-alpha.5' );

				return version.getNextPreRelease( '42.0.0-alpha' )
					.then( result => {
						expect( result ).to.equal( '42.0.0-alpha.6' );
					} );
			} );

			it( 'returns nightly version with incremented id if older nightly version was already published', () => {
				sandbox.stub( version, 'getLastPreRelease' ).resolves( '0.0.0-nightly-20230615.5' );

				return version.getNextPreRelease( '0.0.0-nightly' )
					.then( result => {
						expect( result ).to.equal( '0.0.0-nightly-20230615.6' );
					} );
			} );
		} );

		describe( 'getNextNightly()', () => {
			let clock;

			beforeEach( () => {
				sandbox.stub( version, 'getNextPreRelease' ).resolves( '0.0.0-nightly-20230615.1' );

				clock = sinon.useFakeTimers( {
					now: new Date( '2023-06-15 12:00:00' )
				} );
			} );

			afterEach( () => {
				clock.restore();
			} );

			it( 'asks for a last nightly pre-release version', () => {
				return version.getNextNightly()
					.then( result => {
						expect( version.getNextPreRelease.calledOnce ).to.equal( true );
						expect( version.getNextPreRelease.firstCall.args[ 0 ] ).to.equal( '0.0.0-nightly-20230615' );

						expect( result ).to.equal( '0.0.0-nightly-20230615.1' );
					} );
			} );
		} );

		describe( 'getLastTagFromGit()', () => {
			it( 'returns last tag if exists', () => {
				sandbox.stub( tools, 'shExec' ).returns( 'v1.0.0' );

				expect( version.getLastTagFromGit() ).to.equal( '1.0.0' );
			} );

			it( 'returns null if tags do not exist', () => {
				sandbox.stub( tools, 'shExec' ).returns( '' );

				expect( version.getLastTagFromGit() ).to.equal( null );
			} );
		} );

		describe( 'getCurrent()', () => {
			it( 'returns current version from "package.json"', () => {
				getPackageJsonStub.returns( { version: '0.1.2' } );

				expect( version.getCurrent() ).to.equal( '0.1.2' );
			} );
		} );
	} );
} );
