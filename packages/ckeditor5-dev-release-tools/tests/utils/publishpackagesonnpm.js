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

			publishPackagesOnNpm = require( '../../lib/utils/publishpackagesonnpm' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should do nothing if list of packages is empty', () => {
			return publishPackagesOnNpm( [] )
				.then( () => {
					expect( stubs.devUtils.tools.shExec.called ).to.equal( false );
					expect( stubs.fs.remove.called ).to.equal( false );
				} );
		} );

		it( 'should publish packages on npm with provided npm tag', () => {
			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} )
				.then( () => {
					expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 2 );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 0 ] ).to.equal( 'npm publish --access=public --tag staging' );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-foo' );
					expect( stubs.devUtils.tools.shExec.secondCall.args[ 0 ] ).to.equal( 'npm publish --access=public --tag staging' );
					expect( stubs.devUtils.tools.shExec.secondCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-bar' );
				} );
		} );

		it( 'should publish packages on npm asynchronously', () => {
			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} )
				.then( () => {
					expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 2 );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'async', true );
					expect( stubs.devUtils.tools.shExec.secondCall.args[ 1 ] ).to.have.property( 'async', true );
				} );
		} );

		it( 'should set the verbosity level to "error" during publishing packages', () => {
			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} )
				.then( () => {
					expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 2 );
					expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'verbosity', 'error' );
					expect( stubs.devUtils.tools.shExec.secondCall.args[ 1 ] ).to.have.property( 'verbosity', 'error' );
				} );
		} );

		it( 'should output the progress status during publishing packages', () => {
			const outputHistory = [];
			const listrTask = {
				set output( status ) {
					outputHistory.push( status );
				}
			};
			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', listrTask )
				.then( () => {
					expect( outputHistory ).to.have.length( 2 );
					expect( outputHistory[ 0 ] ).to.equal( 'Status: 1/2. Processing the "ckeditor5-foo" directory.' );
					expect( outputHistory[ 1 ] ).to.equal( 'Status: 2/2. Processing the "ckeditor5-bar" directory.' );
				} );
		} );

		it( 'should publish packages on npm one after the other', () => {
			const clock = sinon.useFakeTimers();

			publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} );

			expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
			expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-foo' );

			// Break the event loop to allow any scheduled promise callbacks to execute.
			return clock.tickAsync()
				.then( () => {
					expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 2 );
					expect( stubs.devUtils.tools.shExec.secondCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-bar' );
				} )
				.finally( () => {
					clock.restore();
				} );
		} );

		it( 'should remove package directory after publishing on npm', () => {
			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} )
				.then( () => {
					expect( stubs.fs.remove.callCount ).to.equal( 2 );
					expect( stubs.fs.remove.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-foo' );
					expect( stubs.fs.remove.secondCall.args[ 0 ] ).to.equal( 'ckeditor5-bar' );
				} );
		} );

		it( 'should throw when publishing on npm failed', () => {
			stubs.devUtils.tools.shExec.rejects();

			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} )
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

			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.fs.remove.callCount ).to.equal( 0 );
					}
				);
		} );

		it( 'should stop processing next packages when publishing on npm failed', () => {
			stubs.devUtils.tools.shExec.rejects();

			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
						expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-foo' );
					}
				);
		} );

		it( 'should stop processing next packages when removing package directory failed', () => {
			stubs.fs.remove.rejects();

			return publishPackagesOnNpm( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'staging', {} )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					() => {
						expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
						expect( stubs.devUtils.tools.shExec.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-foo' );

						expect( stubs.fs.remove.callCount ).to.equal( 1 );
						expect( stubs.fs.remove.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-foo' );
					}
				);
		} );
	} );
} );
