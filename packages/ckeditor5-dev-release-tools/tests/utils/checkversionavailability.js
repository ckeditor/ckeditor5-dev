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

		it( 'should ask npm if provided version for a package already exists', async () => {
			stubs.shExec.rejects( new Error( 'is not in this registry' ) );

			await checkVersionAvailability( '1.0.1', 'stub-package' );

			expect( stubs.shExec.callCount ).to.equal( 1 );
			expect( stubs.shExec.firstCall.args[ 0 ] ).to.equal( 'npm show stub-package@1.0.1 version' );
		} );

		it( 'should throw an error when the version is already in use', async () => {
			stubs.shExec.resolves( '' );

			try {
				await checkVersionAvailability( '1.0.1', 'stub-package' );
				throw new Error( 'Expected to throw.' );
			} catch ( err ) {
				expect( err.message ).to.equal( 'Provided version 1.0.1 is already used in npm by stub-package.' );
			}
		} );

		it( 'should not throw an error when version is not in use', async () => {
			stubs.shExec.rejects( new Error( 'is not in this registry' ) );

			try {
				await checkVersionAvailability( '1.0.1', 'stub-package' );
			} catch ( err ) {
				throw new Error( 'Expected not to throw.' );
			}
		} );

		it( 'should throw an error when checking the version availability check rejects error', async () => {
			stubs.shExec.rejects( new Error( 'custom error' ) );

			try {
				await checkVersionAvailability( '1.0.1', 'stub-package' );
				throw new Error( 'Expected to throw.' );
			} catch ( err ) {
				expect( err.message ).to.equal( 'custom error' );
			}
		} );
	} );
} );
