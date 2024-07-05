/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
	describe( 'publishPackageOnNpmCallback()', () => {
		let publishPackageOnNpmCallback, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				fs: {
					remove: sandbox.stub().resolves()
				},
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

			mockery.registerMock( 'fs-extra', stubs.fs );
			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', stubs.devUtils );

			publishPackageOnNpmCallback = require( '../../lib/utils/publishpackageonnpmcallback' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should publish package on npm with provided npm tag', () => {
			const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

			return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
				.then( () => {
					expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 0 ] ).to.equal( 'npm publish --access=public --tag nightly' );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'cwd', packagePath );
				} );
		} );

		it( 'should publish packages on npm asynchronously', () => {
			const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

			return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
				.then( () => {
					expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'async', true );
				} );
		} );

		it( 'should set the verbosity level to "error" during publishing packages', () => {
			const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

			return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
				.then( () => {
					expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'verbosity', 'error' );
				} );
		} );

		it( 'should remove package directory after publishing on npm', () => {
			const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

			return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
				.then( () => {
					expect( stubs.fs.remove.callCount ).to.equal( 1 );
					expect( stubs.fs.remove.firstCall.args[ 0 ] ).to.equal( packagePath );
				} );
		} );

		it( 'should throw when publishing on npm failed', () => {
			stubs.devUtils.tools.shExec.rejects();

			const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

			return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal( 'Unable to publish "ckeditor5-foo" package.' );
					}
				);
		} );

		it( 'should not remove a package directory when publishing on npm failed', () => {
			stubs.devUtils.tools.shExec.rejects();

			const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

			return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.fs.remove.callCount ).to.equal( 0 );
					}
				);
		} );

		it( 'should not remove a package directory and not throw error when publishing on npm failed with code 409', async () => {
			stubs.devUtils.tools.shExec.rejects( new Error( 'code E409' ) );

			const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

			await publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )

			expect( stubs.fs.remove.callCount ).to.equal( 0 );
		} );
	} );
} );
