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

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', { tools: stubs.tools } );

		reassignNpmTags = require( '../../lib/tasks/reassignnpmtags' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
		sinon.restore();
	} );

	it( 'should throw an error when `authorizedUser` does not match user logged in to npm', () => {
		stubs.tools.shExec.withArgs( 'npm whoami' ).returns( 'incorrect-npm-user' );

		expect( () => reassignNpmTags( { authorizedUser: 'correct-npm-user' } ) )
			.to.throw( 'User: incorrect-npm-user is not matching authorized user: correct-npm-user.' );
	} );

	it( 'should not update tags when user is not logged in', () => {
		stubs.tools.shExec.withArgs( 'npm whoami' ).returns( 'authorized-user' );
		stubs.tools.shExec.withArgs( sinon.match( 'npm show' ) ).throws( 'User is not logged in error.' );
		const npmDistTagAdd = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag add' ) );
		const npmDistTagRm = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag rm' ) );

		reassignNpmTags( { authorizedUser: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd ).not.to.be.called;
		expect( npmDistTagRm ).not.to.be.called;
	} );

	it( 'should skip updating tags when provided version matches existing version for tag latest', () => {
		stubs.tools.shExec.withArgs( 'npm whoami' ).returns( 'authorized-user' );
		stubs.tools.shExec.withArgs( sinon.match( 'npm show' ) ).returns( '1.0.0' );
		const npmDistTagAdd = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag add' ) );
		const npmDistTagRm = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag rm' ) );

		reassignNpmTags( { authorizedUser: 'authorized-user', version: '1.0.0', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd ).not.to.be.called;
		expect( npmDistTagRm ).not.to.be.called;
	} );

	it( 'should update tags when version when latest tag for provided version does not yet exist', () => {
		stubs.tools.shExec.withArgs( 'npm whoami' ).returns( 'authorized-user' );
		stubs.tools.shExec.withArgs( sinon.match( 'npm show' ) ).returns( '1.0.0' );
		const npmDistTagAdd = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag add' ) );
		const npmDistTagRm = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag rm' ) );

		reassignNpmTags( { authorizedUser: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd.firstCall.args[ 0 ] ).to.equal( 'npm dist-tag add package1@1.0.1 latest' );
		expect( npmDistTagAdd.secondCall.args[ 0 ] ).to.equal( 'npm dist-tag add package2@1.0.1 latest' );
		expect( npmDistTagRm.firstCall.args[ 0 ] ).to.equal( 'npm dist-tag rm package1@1.0.1 staging' );
		expect( npmDistTagRm.secondCall.args[ 0 ] ).to.equal( 'npm dist-tag rm package2@1.0.1 staging' );
	} );

	it( 'should continue updating packages even if first package update fails', () => {
		stubs.tools.shExec.withArgs( 'npm whoami' ).returns( 'authorized-user' );
		stubs.tools.shExec.withArgs( sinon.match( 'npm show' ) ).returns( '1.0.0' );
		const npmDistTagAdd = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag add' ) );
		const npmDistTagRm = stubs.tools.shExec.withArgs( sinon.match( 'npm dist-tag rm' ) );
		npmDistTagAdd.onFirstCall().throws( 'Npm error while updating tag.' );

		reassignNpmTags( { authorizedUser: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd.firstCall.args[ 0 ] ).to.equal( 'npm dist-tag add package1@1.0.1 latest' );
		expect( npmDistTagAdd.secondCall.args[ 0 ] ).to.equal( 'npm dist-tag add package2@1.0.1 latest' );
		expect( npmDistTagRm.firstCall.args[ 0 ] ).to.equal( 'npm dist-tag rm package2@1.0.1 staging' );
		expect( npmDistTagRm.callCount ).to.equal( 1 );
	} );
} );
