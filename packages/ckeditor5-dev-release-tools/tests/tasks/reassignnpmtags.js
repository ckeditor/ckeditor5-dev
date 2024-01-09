/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
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
				createSpinner: sinon.stub().callsFake( () => {
					return stubs.spinner;
				} )
			},
			assertNpmAuthorization: sinon.stub().resolves( true ),
			spinner: {
				start: sinon.stub(),
				increase: sinon.stub(),
				finish: sinon.stub()
			},
			chalk: {
				get bold() {
					return stubs.chalk;
				},
				green: sinon.stub().callsFake( str => str ),
				yellow: sinon.stub().callsFake( str => str ),
				red: sinon.stub().callsFake( str => str )
			},
			columns: sinon.stub(),
			console: {
				log: sinon.stub( console, 'log' )
			},
			util: {
				promisify: sinon.stub().callsFake( () => stubs.exec )
			},
			exec: sinon.stub()
		};

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', { tools: stubs.tools } );
		mockery.registerMock( '../utils/assertnpmauthorization', stubs.assertNpmAuthorization );
		mockery.registerMock( 'cli-columns', stubs.columns );
		mockery.registerMock( 'chalk', stubs.chalk );
		mockery.registerMock( 'util', stubs.util );

		reassignNpmTags = require( '../../lib/tasks/reassignnpmtags' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
		sinon.restore();
	} );

	it( 'should throw an error when assertNpmAuthorization throws error', async () => {
		stubs.assertNpmAuthorization.throws( new Error( 'User not logged in error' ) );
		const npmDistTagAdd = stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) );

		try {
			await reassignNpmTags( { npmOwner: 'correct-npm-user', version: '1.0.1', packages: [ 'package1' ] } );
			throw new Error( 'Expected to throw' );
		} catch ( e ) {
			expect( e.message ).to.equal( 'User not logged in error' );
		}

		expect( npmDistTagAdd.callCount ).to.equal( 0 );
	} );

	it( 'should skip updating tags when provided version matches existing version for tag latest', async () => {
		stubs.columns.returns( 'package1 | package2' );
		stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) ).throws( new Error( 'is already set to version' ) );

		await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.0', packages: [ 'package1', 'package2' ] } );

		expect( stubs.console.log.firstCall.args[ 0 ] ).to.equal( '⬇️ Packages skipped:' );
		expect( stubs.console.log.secondCall.args[ 0 ] ).to.deep.equal( 'package1 | package2' );
	} );

	it( 'should update tags when tag latest for provided version does not yet exist', async () => {
		const npmDistTagAdd = stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) ).resolves( { stdout: '+latest' } );

		await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd.firstCall.args[ 0 ] ).to.equal( 'npm dist-tag add package1@1.0.1 latest' );
		expect( npmDistTagAdd.secondCall.args[ 0 ] ).to.equal( 'npm dist-tag add package2@1.0.1 latest' );
	} );

	it( 'should continue updating packages even if first package update fails', async () => {
		const npmDistTagAdd = stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) );
		npmDistTagAdd.onFirstCall().throws( new Error( 'Npm error while updating tag.' ) );

		await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( npmDistTagAdd.firstCall.args[ 0 ] ).to.equal( 'npm dist-tag add package1@1.0.1 latest' );
		expect( npmDistTagAdd.secondCall.args[ 0 ] ).to.equal( 'npm dist-tag add package2@1.0.1 latest' );
	} );

	describe( 'UX', () => {
		it( 'should create a spinner before starting processing packages', async () => {
			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [] } );

			expect( stubs.tools.createSpinner.callCount ).to.equal( 1 );
			expect( stubs.tools.createSpinner.firstCall.args[ 0 ] ).to.equal( 'Reassigning npm tags...' );
			expect( stubs.tools.createSpinner.firstCall.args[ 1 ] ).to.be.an( 'object' );
			expect( stubs.tools.createSpinner.firstCall.args[ 1 ] ).to.have.property( 'total', 0 );

			expect( stubs.spinner.start.callCount ).to.equal( 1 );
		} );

		it( 'should increase the spinner counter after successfully processing a package', async () => {
			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1' ] } );

			expect( stubs.spinner.increase.callCount ).to.equal( 1 );
		} );

		it( 'should increase the spinner counter after failure processing a package', async () => {
			const npmDistTagAdd = stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) );
			npmDistTagAdd.onFirstCall().throws( new Error( 'Npm error while updating tag.' ) );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1' ] } );

			expect( stubs.spinner.increase.callCount ).to.equal( 1 );
		} );

		it( 'should finish the spinner once all packages have been processed', async () => {
			const npmDistTagAdd = stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) );
			npmDistTagAdd.onFirstCall().throws( new Error( 'Npm error while updating tag.' ) );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

			sinon.assert.callOrder(
				stubs.spinner.start,
				stubs.spinner.increase,
				stubs.spinner.increase,
				stubs.spinner.finish
			);
		} );

		it( 'should display skipped packages in a column', async () => {
			stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) ).throws( new Error( 'is already set to version' ) );
			stubs.columns.returns( '1 | 2 | 3' );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.0', packages: [ 'package1', 'package2' ] } );

			expect( stubs.columns.callCount ).to.equal( 1 );
			expect( stubs.columns.firstCall.args[ 0 ] ).to.be.an( 'array' );
			expect( stubs.columns.firstCall.args[ 0 ] ).to.include( 'package1' );
			expect( stubs.columns.firstCall.args[ 0 ] ).to.include( 'package2' );
			expect( stubs.console.log.callCount ).to.equal( 2 );
			expect( stubs.console.log.firstCall.args[ 0 ] ).to.equal( '⬇️ Packages skipped:' );
			expect( stubs.console.log.secondCall.args[ 0 ] ).to.equal( '1 | 2 | 3' );
		} );

		it( 'should display processed packages in a column', async () => {
			stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) ).resolves( { stdout: '+latest' } );
			stubs.columns.returns( '1 | 2 | 3' );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

			expect( stubs.columns.callCount ).to.equal( 1 );
			expect( stubs.columns.firstCall.args[ 0 ] ).to.be.an( 'array' );
			expect( stubs.columns.firstCall.args[ 0 ] ).to.include( 'package1' );
			expect( stubs.columns.firstCall.args[ 0 ] ).to.include( 'package2' );
			expect( stubs.console.log.callCount ).to.equal( 2 );
			expect( stubs.console.log.firstCall.args[ 0 ] ).to.equal( '✨ Tags updated:' );
			expect( stubs.console.log.secondCall.args[ 0 ] ).to.equal( '1 | 2 | 3' );
		} );

		it( 'should display errors found during processing a package', async () => {
			const npmDistTagAdd = stubs.exec.withArgs( sinon.match( 'npm dist-tag add' ) );
			npmDistTagAdd.throws( new Error( 'Npm error while updating tag.' ) );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1' ] } );

			expect( stubs.console.log.callCount ).to.equal( 2 );
			expect( stubs.console.log.firstCall.args[ 0 ] ).to.equal( '🐛 Errors found:' );
			expect( stubs.console.log.secondCall.args[ 0 ] ).to.equal( '* Npm error while updating tag.' );
		} );
	} );
} );
