/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
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

			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', { tools } );
			mockery.registerMock( './getpackagejson', getPackageJsonStub );
			mockery.registerMock( './changelog', {
				getChangelog: changelogStub
			} );

			version = require( '../../../lib/release-tools/utils/versions' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		describe( 'getLastFromChangelog()', () => {
			it( 'returns version from changelog', () => {
				changelogStub.returns( `## [1.0.0]` );

				expect( version.getLastFromChangelog() ).to.equal( '1.0.0' );
			} );

			it( 'returns null for empty changelog', () => {
				changelogStub.returns( '' );

				expect( version.getLastFromChangelog() ).to.equal( null );
			} );
		} );

		describe( 'getLastFromTag()', () => {
			it( 'returns last tag if exists', () => {
				sandbox.stub( tools, 'shExec' ).returns( `v1.0.0` );

				expect( version.getLastFromTag() ).to.equal( '1.0.0' );
			} );

			it( 'returns null if tags do not exist', () => {
				sandbox.stub( tools, 'shExec' ).returns( '' );

				expect( version.getLastFromTag() ).to.equal( null );
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
