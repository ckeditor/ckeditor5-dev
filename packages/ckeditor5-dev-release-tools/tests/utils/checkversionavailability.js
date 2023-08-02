/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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
				shExec: sandbox.stub()
			};

			checkVersionAvailability = proxyquire( '../../lib/utils/checkversionavailability.js', {
				'@ckeditor/ckeditor5-dev-utils': {
					tools: {
						shExec: stubs.shExec
					}
				}
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should resolve if version does not exist (npm >= 8.13.0)', () => {
			stubs.shExec.rejects( new Error( 'npm ERR! code E404' ) );

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( () => {
					expect( stubs.shExec.callCount ).to.equal( 1 );
					expect( stubs.shExec.firstCall.args[ 0 ] ).to.equal( 'npm show stub-package@1.0.1 version' );
				} )
				.catch( () => {
					throw new Error( 'Expected to be resolved.' );
				} );
		} );

		it( 'should resolve if version does not exist (npm < 8.13.0)', () => {
			stubs.shExec.resolves();

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.catch( () => {
					throw new Error( 'Expected to be resolved.' );
				} );
		} );

		it( 'should throw an error if version exists', () => {
			stubs.shExec.resolves( '1.0.1' );

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( () => {
					throw new Error( 'Expected to be rejected.' );
				} )
				.catch( error => {
					expect( error.message ).to.equal( 'The "stub-package@1.0.1" already exists in npm.' );
				} );
		} );

		it( 'should throw an error if unknown error occured', () => {
			stubs.shExec.rejects( new Error( 'Unknown error.' ) );

			return checkVersionAvailability( '1.0.1', 'stub-package' )
				.then( () => {
					throw new Error( 'Expected to be rejected.' );
				} )
				.catch( error => {
					expect( error.message ).to.equal( 'Unknown error.' );
				} );
		} );
	} );
} );
