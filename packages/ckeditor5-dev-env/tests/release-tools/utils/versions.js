/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const proxyquire = require( 'proxyquire' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	let version, sandbox, changelogStub, getPackageJsonStub;

	describe( 'versions', () => {
		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			changelogStub = sandbox.stub();
			getPackageJsonStub = sandbox.stub();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( './getpackagejson', getPackageJsonStub );
			mockery.registerMock( './changelog', {
				getChangelog: changelogStub
			} );

			version = proxyquire( '../../../lib/release-tools/utils/versions', {
				'@ckeditor/ckeditor5-dev-utils': {
					tools
				}
			} );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		describe( 'getLastFromChangelog()', () => {
			describe( 'changelog generated for the first time', () => {
				it( 'returns version from changelog #1', () => {
					const expectedVersion = '1.0.0';

					changelogStub.returns( [
						'Changelog',
						'=========',
						'',
						`## ${ expectedVersion } (2017-03-08)`
					].join( '\n' ) );

					expect( version.getLastFromChangelog() ).to.equal( expectedVersion );
				} );

				it( 'returns version from changelog #2', () => {
					const expectedVersion = '1.0.0-alpha';

					changelogStub.returns( [
						'Changelog',
						'=========',
						'',
						`## ${ expectedVersion } (2017-03-08)`
					].join( '\n' ) );

					expect( version.getLastFromChangelog() ).to.equal( expectedVersion );
				} );

				it( 'returns version from changelog #3', () => {
					const expectedVersion = '1.0.0-alpha+001';

					changelogStub.returns( [
						'Changelog',
						'=========',
						'',
						`## ${ expectedVersion } (2017-03-08)`
					].join( '\n' ) );

					expect( version.getLastFromChangelog() ).to.equal( expectedVersion );
				} );

				it( 'returns version from changelog #4', () => {
					const expectedVersion = '1.0.0-beta.2';

					changelogStub.returns( [
						'Changelog',
						'=========',
						'',
						`## ${ expectedVersion } (2017-03-08)`
					].join( '\n' ) );

					expect( version.getLastFromChangelog() ).to.equal( expectedVersion );
				} );
			} );

			describe( 'changelog contains URLs which compare the versions', () => {
				it( 'returns version from changelog #1', () => {
					const expectedVersion = '1.0.0';

					changelogStub.returns( [
						'Changelog',
						'=========',
						'',
						`## [${ expectedVersion }](https://github.com/ckeditor/ckeditor5-dev/compare/v0.1.0...${ expectedVersion }) (2017-03-08)`
					].join( '\n' ) );

					expect( version.getLastFromChangelog() ).to.equal( expectedVersion );
				} );

				it( 'returns version from changelog #2', () => {
					const expectedVersion = '1.0.0-alpha';

					changelogStub.returns( [
						'Changelog',
						'=========',
						'',
						`## [${ expectedVersion }](https://github.com/ckeditor/ckeditor5-dev/compare/v0.1.0...${ expectedVersion }) (2017-03-08)`
					].join( '\n' ) );

					expect( version.getLastFromChangelog() ).to.equal( expectedVersion );
				} );

				it( 'returns version from changelog #3', () => {
					const expectedVersion = '1.0.0-alpha+001';

					changelogStub.returns( [
						'Changelog',
						'=========',
						'',
						`## [${ expectedVersion }](https://github.com/ckeditor/ckeditor5-dev/compare/v0.1.0...${ expectedVersion }) (2017-03-08)`
					].join( '\n' ) );

					expect( version.getLastFromChangelog() ).to.equal( expectedVersion );
				} );

				it( 'returns version from changelog #4', () => {
					const expectedVersion = '1.0.0-beta.2';

					changelogStub.returns( [
						'Changelog',
						'=========',
						'',
						`## [${ expectedVersion }](https://github.com/ckeditor/ckeditor5-dev/compare/v0.1.0...${ expectedVersion }) (2017-03-08)`
					].join( '\n' ) );

					expect( version.getLastFromChangelog() ).to.equal( expectedVersion );
				} );
			} );

			it( 'returns null for empty changelog', () => {
				changelogStub.returns( '' );

				expect( version.getLastFromChangelog() ).to.equal( null );
			} );
		} );

		describe( 'getLastTagFromGit()', () => {
			it( 'returns last tag if exists', () => {
				sandbox.stub( tools, 'shExec' ).returns( `v1.0.0` );

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
