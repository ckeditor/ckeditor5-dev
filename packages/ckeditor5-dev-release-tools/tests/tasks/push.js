/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/tasks', () => {
	describe( 'push()', () => {
		let options, stubs, push;

		beforeEach( () => {
			options = {
				releaseBranch: 'release',
				version: '1.3.5',
				cwd: 'custom/working/dir'
			};

			stubs = {
				devUtils: {
					tools: {
						shExec: sinon.stub()
					}
				},
				process: {
					cwd: sinon.stub( process, 'cwd' ).returns( 'current/working/dir' )
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', stubs.devUtils );

			push = require( '../../lib/tasks/push' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sinon.restore();
		} );

		it( 'should be a function', () => {
			expect( push ).to.be.a( 'function' );
		} );

		it( 'should execute command with correct arguments', async () => {
			push( options );

			expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
			expect( stubs.devUtils.tools.shExec.getCall( 0 ).args.length ).to.equal( 2 );
			expect( stubs.devUtils.tools.shExec.getCall( 0 ).args[ 0 ] ).to.equal( 'git push origin release v1.3.5' );
			expect( stubs.devUtils.tools.shExec.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
				cwd: 'custom/working/dir',
				verbosity: 'error'
			} );
		} );

		it( 'should use "process.cwd()" if the "cwd" option was not used', async () => {
			delete options.cwd;

			push( options );

			expect( stubs.devUtils.tools.shExec.callCount ).to.equal( 1 );
			expect( stubs.devUtils.tools.shExec.getCall( 0 ).args.length ).to.equal( 2 );
			expect( stubs.devUtils.tools.shExec.getCall( 0 ).args[ 0 ] ).to.equal( 'git push origin release v1.3.5' );
			expect( stubs.devUtils.tools.shExec.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
				cwd: 'current/working/dir',
				verbosity: 'error'
			} );
		} );
	} );
} );
