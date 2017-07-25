/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const mockery = require( 'mockery' );

describe( 'dev-lint/utils', () => {
	let getGitIgnore, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			fs: {
				readFileSync: sandbox.stub()
			}
		};

		mockery.registerMock( 'fs', stubs.fs );

		getGitIgnore = require( '../../lib/utils/getgitignore' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'getGitIgnore()', () => {
		it( 'returns a list of ignored files as glob patterns', () => {
			stubs.fs.readFileSync.returns( `
# These files will be ignored.
node_modules/
coverage/

lerna-debug.log
npm-debug.log
` );

			expect( getGitIgnore() ).to.deep.equal( [
				'!node_modules/**',
				'!coverage/**',
				'!lerna-debug.log',
				'!npm-debug.log'
			] );
		} );
	} );
} );
