/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const mockery = require( 'mockery' );
const sinon = require( 'sinon' );

describe( 'commitAndTag()', () => {
	let stubs, commitAndTag;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			tools: {
				shExec: sinon.stub()
			},
			glob: {
				globSync: sinon.stub().returns( [] )
			}
		};

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils/lib/tools', stubs.tools );
		mockery.registerMock( 'glob', stubs.glob );

		commitAndTag = require( '../../lib/tasks/commitandtag' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
		sinon.restore();
	} );

	it( 'should pass cwd to shExec', () => {
		commitAndTag( { version: '1.0.0', cwd: 'my-cwd' } );

		expect( stubs.tools.shExec.firstCall.args[ 1 ] ).to.deep.equal( { cwd: 'my-cwd' } );
		expect( stubs.tools.shExec.secondCall.args[ 1 ] ).to.deep.equal( { cwd: 'my-cwd' } );
		expect( stubs.tools.shExec.thirdCall.args[ 1 ] ).to.deep.equal( { cwd: 'my-cwd' } );
	} );

	it( 'should call git add with root package.json and packages when packagesDirectory is defined', () => {
		stubs.glob.globSync.returns( [ 'packages/first-package/package.json', 'packages/second-package/package.json' ] );

		commitAndTag( { version: '1.0.0', packagesDirectory: 'packages' } );

		expect( stubs.tools.shExec.firstCall.args[ 0 ] )
			.to.equal( 'git add package.json packages/first-package/package.json packages/second-package/package.json' );
	} );

	it( 'should call git commit with correct message', () => {
		commitAndTag( { version: '1.0.0', packagesDirectory: 'packages' } );

		expect( stubs.tools.shExec.secondCall.args[ 0 ] ).to.equal( 'git commit --message "Release: v1.0.0."' );
	} );

	it( 'should call git tag with correct version', () => {
		commitAndTag( { version: '1.0.0', packagesDirectory: 'packages' } );

		expect( stubs.tools.shExec.thirdCall.args[ 0 ] ).to.equal( 'git tag v1.0.0' );
	} );
} );
