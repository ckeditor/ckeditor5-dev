/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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
