/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const mockery = require( 'mockery' );

describe( 'dev-lint/utils', () => {
	let getSourceFiles, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			getGitIgnore: sandbox.stub()
		};

		mockery.registerMock( './getgitignore', stubs.getGitIgnore );

		getSourceFiles = require( '../../lib/utils/getsourcefiles' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'getSourceFiles()', () => {
		it( 'returns a list of source files', () => {
			stubs.getGitIgnore.returns( [
				'!**/node_modules/**'
			] );

			expect( getSourceFiles( { ignoredFiles: [] } ) ).to.deep.equal( [
				'**/*.js',
				'!**/node_modules/**'
			] );
		} );

		it( 'ignores also specified list of files', () => {
			stubs.getGitIgnore.returns( [
				'!**/node_modules/**'
			] );

			const ignoredFiles = [
				'./src/index.js'
			];

			expect( getSourceFiles( { ignoredFiles } ) ).to.deep.equal( [
				'**/*.js',
				'!./src/index.js',
				'!**/node_modules/**'
			] );
		} );
	} );
} );
