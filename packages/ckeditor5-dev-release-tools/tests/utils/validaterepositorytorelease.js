/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
	describe( 'validateRepositoryToRelease()', () => {
		let validateRepositoryToRelease, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
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

			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', stubs.devUtils );

			validateRepositoryToRelease = require( '../../lib/utils/validaterepositorytorelease' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'resolves an empty array if validation passes (remote branch exists)', async () => {
			stubs.devUtils.tools.shExec.resolves( '## master...origin/master' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

			expect( errors ).to.be.an( 'Array' );
			expect( errors.length ).to.equal( 0 );
		} );

		it( 'resolves an empty array if validation passes (missing remote branch)', async () => {
			stubs.devUtils.tools.shExec.resolves( '## master' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

			expect( errors ).to.be.an( 'Array' );
			expect( errors.length ).to.equal( 0 );
		} );

		it( 'resolves an array with errors if the release changes are not defined', async () => {
			stubs.devUtils.tools.shExec.resolves( '## master...origin/master' );

			const errors = await validateRepositoryToRelease( { changes: null, version: '1.0.0' } );

			expect( errors.length ).to.equal( 1 );
			expect( errors[ 0 ] ).to.equal( 'Cannot find changelog entries for version "1.0.0".' );
		} );

		it( 'resolves an array with errors if the specified version is not a string', async () => {
			stubs.devUtils.tools.shExec.resolves( '## master...origin/master' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: null } );

			expect( errors.length ).to.equal( 1 );
			expect( errors[ 0 ] ).to.equal( 'Passed an invalid version ("null").' );
		} );

		it( 'resolves an array with errors if the specified version is empty string', async () => {
			stubs.devUtils.tools.shExec.resolves( '## master...origin/master' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '' } );

			expect( errors.length ).to.equal( 1 );
			expect( errors[ 0 ] ).to.equal( 'Passed an invalid version ("").' );
		} );

		it( 'resolves an array with errors if current branch is not "master" (remote branch exists)', async () => {
			stubs.devUtils.tools.shExec.resolves( '## develop...origin/develop' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

			expect( errors.length ).to.equal( 1 );
			expect( errors[ 0 ] ).to.equal( 'Not on the "#master" branch.' );
		} );

		it( 'resolves an array with errors if current branch is not "master" (missing remote branch)', async () => {
			stubs.devUtils.tools.shExec.resolves( '## develop' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

			expect( errors.length ).to.equal( 1 );
			expect( errors[ 0 ] ).to.equal( 'Not on the "#master" branch.' );
		} );

		it( 'resolves an array with errors if master is behind with origin (remote branch exists)', async () => {
			stubs.devUtils.tools.shExec.resolves( '## master...origin/master [behind 2]' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

			expect( errors.length ).to.equal( 1 );
			expect( errors[ 0 ] ).to.equal( 'The branch is behind with the remote.' );
		} );

		it( 'resolves an array with errors if master is behind with origin (missing remote branch)', async () => {
			stubs.devUtils.tools.shExec.resolves( '## master [behind 2]' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

			expect( errors.length ).to.equal( 1 );
			expect( errors[ 0 ] ).to.equal( 'The branch is behind with the remote.' );
		} );

		it( 'allows skipping the branch check', async () => {
			stubs.devUtils.tools.shExec.resolves( '## develop...origin/develop' );

			const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0', ignoreBranchCheck: true } );

			expect( errors.length ).to.equal( 0 );
		} );

		it( 'uses non-master branch for releasing if specified', async () => {
			stubs.devUtils.tools.shExec.resolves( '## release...origin/release' );

			const errors = await validateRepositoryToRelease( { branch: 'release', changes: 'Some changes.', version: '1.0.0' } );

			expect( errors ).to.be.an( 'Array' );
			expect( errors.length ).to.equal( 0 );
		} );

		it( 'allows skipping the branch check (even if specified)', async () => {
			stubs.devUtils.tools.shExec.resolves( '## develop...origin/develop' );

			const errors = await validateRepositoryToRelease( {
				branch: 'release',
				changes: 'Some changes.',
				version: '1.0.0',
				ignoreBranchCheck: true
			} );

			expect( errors.length ).to.equal( 0 );
		} );
	} );
} );
