/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils/transform-commit', () => {
	let getChangedFilesForCommit, sandbox, shExecStub;

	describe( 'getChangedFilesForCommit()', () => {
		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			shExecStub = sandbox.stub();

			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
				tools: {
					shExec: shExecStub
				}
			} );

			getChangedFilesForCommit = require( '../../../../lib/release-tools/utils/transform-commit/getchangedfilesforcommit' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'returns an empty array if commit was empty', () => {
			shExecStub.returns( '' );

			expect( getChangedFilesForCommit( 'commit sha1' ) ).to.deep.equal( [] );
		} );

		it( 'returns an array with changed files', () => {
			shExecStub.returns( `README.md
packages/ckeditor5-dev-env/tests/index.js` );

			expect( getChangedFilesForCommit( 'a1b2c3d' ) ).to.deep.equal( [
				'README.md',
				'packages/ckeditor5-dev-env/tests/index.js'
			] );

			expect( shExecStub.firstCall.args[ 0 ] ).to.equal( 'git log -m -1 --name-only --pretty="format:" a1b2c3d' );
		} );

		it( 'should not use "git show" command for collecting changed files', () => {
			shExecStub.returns( '' );
			getChangedFilesForCommit( 'a1b2c3d' );

			expect( shExecStub.firstCall.args[ 0 ] ).to.not.match( /^git show/ );
		} );
	} );
} );
