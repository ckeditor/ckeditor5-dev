/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
	describe( 'assertNpmAuthorization()', () => {
		let assertNpmAuthorization, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				devUtils: {
					tools: {
						shExec: sandbox.stub().resolves()
					}
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', stubs.devUtils );

			assertNpmAuthorization = require( '../../lib/utils/assertnpmauthorization' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should resolve if user is logged to npm as the provided account name', () => {
			stubs.devUtils.tools.shExec.resolves( 'pepe' );

			return assertNpmAuthorization( 'pepe' )
				.then( () => {
					expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 0 ] ).to.equal( 'npm whoami' );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'verbosity', 'error' );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'async', true );
				} );
		} );

		it( 'should trim whitespace characters from the command output before checking the name', () => {
			stubs.devUtils.tools.shExec.resolves( '\t pepe \n' );

			return assertNpmAuthorization( 'pepe' );
		} );

		it( 'should throw if user is not logged to npm', () => {
			stubs.devUtils.tools.shExec.rejects();

			return assertNpmAuthorization( 'pepe' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'You must be logged to npm as "pepe" to execute this release step.'
						);
					} );
		} );

		it( 'should throw if user is logged to npm on different account name', () => {
			stubs.devUtils.tools.shExec.resolves( 'john' );

			return assertNpmAuthorization( 'pepe' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'You must be logged to npm as "pepe" to execute this release step.'
						);
					} );
		} );
	} );
} );
