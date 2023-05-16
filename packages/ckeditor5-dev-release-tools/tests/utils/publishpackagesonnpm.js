/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
	describe( 'publishPackagesOnNpm()', () => {
		let publishPackagesOnNpm, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				fs: {
					remove: sandbox.stub()
				},
				devUtils: {
					tools: {
						shExec: sandbox.stub()
					}
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );
			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', stubs.devUtils );

			publishPackagesOnNpm = require( '../../lib/utils/publishpackagesonnpm' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should do nothing if list of packages is empty', async () => {
			await publishPackagesOnNpm( [] );

			expect( stubs.devUtils.tools.shExec.called ).to.equal( false );
			expect( stubs.fs.remove.called ).to.equal( false );
		} );

		it( 'should publish packages on npm with provided npm tag', async () => {
			await publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging' );

			expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 2 );
			expect( stubs.devUtils.tools.shExec.firstCall.args[ 0 ] ).to.equal( 'npm publish --access=public --tag staging' );
			expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-foo' );
			expect( stubs.devUtils.tools.shExec.secondCall.args[ 0 ] ).to.equal( 'npm publish --access=public --tag staging' );
			expect( stubs.devUtils.tools.shExec.secondCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-bar' );
		} );

		it( 'should publish packages on npm asynchronously', async () => {
			await publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging' );

			expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 2 );
			expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'async', true );
			expect( stubs.devUtils.tools.shExec.secondCall.args[ 1 ] ).to.have.property( 'async', true );
		} );

		it( 'should publish packages on npm one after the other', async () => {
			publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging' );

			expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
			expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-foo' );

			await stubs.devUtils.tools.shExec.resolves();
			await stubs.fs.remove.resolves();

			expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 2 );
			expect( stubs.devUtils.tools.shExec.secondCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-bar' );
		} );
	} );
} );
