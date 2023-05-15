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
				shExec: sinon.stub().resolves()
			},
			glob: {
				glob: sinon.stub().returns( [] )
			}
		};

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			tools: stubs.tools
		} );
		mockery.registerMock( 'glob', stubs.glob );

		commitAndTag = require( '../../lib/tasks/commitandtag' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
		sinon.restore();
	} );

	it( 'should allow to specify custom cwd', async () => {
		await commitAndTag( { version: '1.0.0', cwd: 'my-cwd' } );

		expect( stubs.tools.shExec.firstCall.args[ 1 ].cwd ).to.deep.equal( 'my-cwd' );
		expect( stubs.tools.shExec.secondCall.args[ 1 ].cwd ).to.deep.equal( 'my-cwd' );
		expect( stubs.tools.shExec.thirdCall.args[ 1 ].cwd ).to.deep.equal( 'my-cwd' );
	} );

	it( 'should add provided files to git', async () => {
		stubs.glob.glob.resolves( [
			'package.json',
			'README.md',
			'packages/custom-package/package.json',
			'packages/custom-package/README.md'
		] );

		await commitAndTag( {
			version: '1.0.0',
			files: [ 'package.json', 'README.md', 'packages/*/package.json', 'packages/*/README.md' ]
		} );

		expect( stubs.tools.shExec.firstCall.args[ 0 ] )
			.to.equal( 'git add package.json README.md packages/custom-package/package.json packages/custom-package/README.md' );
	} );

	it( 'should set correct commit message', async () => {
		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages' } );

		expect( stubs.tools.shExec.secondCall.args[ 0 ] ).to.equal( 'git commit --message "Release: v1.0.0."' );
	} );

	it( 'should set correct tag', async () => {
		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages' } );

		expect( stubs.tools.shExec.thirdCall.args[ 0 ] ).to.equal( 'git tag v1.0.0' );
	} );
} );
