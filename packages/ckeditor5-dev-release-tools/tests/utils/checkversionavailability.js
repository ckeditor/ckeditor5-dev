/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-release-tools/utils', () => {
	let checkVersionAvailability, sandbox, stubs;

	describe( 'checkVersionAvailability()', () => {
		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				shExec: sandbox.stub(),
				shellEscape: sinon.stub().callsFake( v => v[ 0 ] )
			};

			checkVersionAvailability = proxyquire( '../../lib/utils/checkversionavailability.js', {
				'@ckeditor/ckeditor5-dev-utils': {
					tools: {
						shExec: stubs.shExec
					}
				},
				'shell-escape': stubs.shellEscape
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should resolve to true if version does not exist (npm >= 8.13.0 && npm < 10.0.0)', () => {
			stubs.shExec.rejects( new Error( 'npm ERR! code E404' ) );

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( result => {
					expect( stubs.shExec.callCount ).to.equal( 1 );
					expect( stubs.shExec.firstCall.args[ 0 ] ).to.equal( 'npm show stub-package@1.0.1 version' );
					expect( result ).to.be.true;
				} );
		} );

		it( 'should resolve to true if version does not exist (npm >= 10.0.0)', () => {
			stubs.shExec.rejects( new Error( 'npm error code E404' ) );

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( result => {
					expect( stubs.shExec.callCount ).to.equal( 1 );
					expect( stubs.shExec.firstCall.args[ 0 ] ).to.equal( 'npm show stub-package@1.0.1 version' );
					expect( result ).to.be.true;
				} );
		} );

		it( 'should resolve to true if version does not exist (npm < 8.13.0)', () => {
			stubs.shExec.resolves();

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( result => {
					expect( result ).to.be.true;
				} );
		} );

		it( 'should resolve to false if version exists', () => {
			stubs.shExec.resolves( '1.0.1' );

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( result => {
					expect( result ).to.be.false;
				} );
		} );

		it( 'should re-throw an error if unknown error occured', () => {
			stubs.shExec.rejects( new Error( 'Unknown error.' ) );

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( () => {
					throw new Error( 'Expected to be rejected.' );
				} )
				.catch( error => {
					expect( error.message ).to.equal( 'Unknown error.' );
				} );
		} );

		it( 'should escape arguments passed to a shell command', async () => {
			stubs.shExec.rejects( new Error( 'npm ERR! code E404' ) );

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( () => {
					expect( stubs.shellEscape.callCount ).to.equal( 2 );
					expect( stubs.shellEscape.firstCall.firstArg ).to.deep.equal( [ 'stub-package' ] );
					expect( stubs.shellEscape.secondCall.firstArg ).to.deep.equal( [ '1.0.1' ] );
				} );
		} );
	} );
} );
