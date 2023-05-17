/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { expect } = require( 'chai' );
const mockery = require( 'mockery' );
const sinon = require( 'sinon' );

describe( 'reassignNpmTags()', () => {
	let stubs, reassignNpmTags;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			tools: {
				shExec: sinon.stub()
			}
		};

		sinon.stub( console, 'log' );
		stubs.tools.shExec.withArgs( 'npm whoami' ).resolves( 'authorized-user' );
		stubs.tools.shExec.withArgs( sinon.match( 'npm show' ) ).resolves( '1.0.0' );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', { tools: stubs.tools } );

		reassignNpmTags = require( '../../lib/tasks/reassignnpmtags' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
		sinon.restore();
	} );

	it( 'should throw an error when provided user does not match user logged in to npm', async () => {
		stubs.tools.shExec.withArgs( 'npm whoami' ).resolves( 'incorrect-npm-user' );

		try {
			await reassignNpmTags( { authorizedUser: 'correct-npm-user' } );
			throw new Error( 'Expected to throw' );
		} catch ( e ) {
			expect( e.message ).to.equal( 'User: incorrect-npm-user is not matching authorized user: correct-npm-user.' );
		}
	} );

	it( 'should throw an error when user is not logged in', async () => {
		stubs.tools.shExec.withArgs( 'npm whoami' ).throws( new Error( 'User is not logged in error.' ) );

		try {
			await reassignNpmTags( { authorizedUser: 'authorized-user' } );
			throw new Error( 'Expected to throw' );
		} catch ( e ) {
			expect( e.message ).to.equal( 'User is not logged in error.' );
		}
	} );

	it( 'should not update tags when can not obtain package version from npm', async () => {
		stubs.tools.shExec.withArgs( sinon.match( 'npm show' ) ).throws( new Error( 'Can not obtain package version.' ) );
		const npmDistTagAdd = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag add' ) );

		await reassignNpmTags( { authorizedUser: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd ).not.to.be.called;
	} );

	it( 'should skip updating tags when provided version matches existing version for tag latest', async () => {
		const npmDistTagAdd = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag add' ) );

		await reassignNpmTags( { authorizedUser: 'authorized-user', version: '1.0.0', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd ).not.to.be.called;
	} );

	it( 'should update tags when tag latest for provided version does not yet exist', async () => {
		const npmDistTagAdd = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag add' ) );

		await reassignNpmTags( { authorizedUser: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd.firstCall.args[ 0 ] ).to.equal( 'npm dist-tag add package1@1.0.1 latest' );
		expect( npmDistTagAdd.secondCall.args[ 0 ] ).to.equal( 'npm dist-tag add package2@1.0.1 latest' );
	} );

	it( 'should continue updating packages even if first package update fails', async () => {
		const npmDistTagAdd = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag add' ) );
		npmDistTagAdd.onFirstCall().throws( new Error( 'Npm error while updating tag.' ) );

		await reassignNpmTags( { authorizedUser: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd.firstCall.args[ 0 ] ).to.equal( 'npm dist-tag add package1@1.0.1 latest' );
		expect( npmDistTagAdd.secondCall.args[ 0 ] ).to.equal( 'npm dist-tag add package2@1.0.1 latest' );
	} );
} );
