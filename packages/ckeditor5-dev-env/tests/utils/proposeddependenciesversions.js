/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const utils = require( '../../lib/utils/changelog' );

describe( 'utils', () => {
	describe( 'proposedDependenciesVersions', () => {
		let proposedDepsVersion, sandbox, execOptions;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( './changelog', utils );

			mockery.registerMock( './executeondependencies', ( options, functionToExecute, done ) => {
				execOptions = options;

				const workspacePath = path.join( options.cwd, options.workspace );

				return Promise.resolve()
					.then( () => functionToExecute( 'ckeditor5-core', path.join( workspacePath, 'ckeditor5-core' ) ) )
					.then( () => functionToExecute( '@ckeditor/ckeditor5-engine', path.join( workspacePath, 'ckeditor5-engine' ) ) )
					.then( () => done() );
			} );

			proposedDepsVersion = require( '../../lib/utils/proposeddependenciesversions' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'returns proposed versions for next release', () => {
			const chdirStub = sandbox.stub( process, 'chdir' );

			const currentVersionStub = sandbox.stub( utils, 'getCurrentVersion' );
			const newReleaseTypeStub = sandbox.stub( utils, 'getNewReleaseType' );
			const nextVersionStub = sandbox.stub( utils, 'getNextVersion' );

			// ckeditor5-core
			currentVersionStub.onFirstCall().returns( 'v0.5.0' );
			newReleaseTypeStub.onFirstCall().returns( Promise.resolve( { releaseType: 'minor' } ) );
			nextVersionStub.onFirstCall().returns( '0.6.0' );

			// ckeditor5-engine
			currentVersionStub.onSecondCall().returns( 'v1.0.0' );
			newReleaseTypeStub.onSecondCall().returns( Promise.resolve( { releaseType: 'patch' } ) );
			nextVersionStub.onSecondCall().returns( '1.0.1' );

			const options = {
				cwd: path.join( __dirname, '..', 'fixtures' ),
				workspace: 'packages/'
			};

			return proposedDepsVersion( options )
				.then( ( versions ) => {
					expect( chdirStub.calledTwice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.match( /ckeditor5-core$/ );
					expect( chdirStub.secondCall.args[ 0 ] ).to.match( /ckeditor5-engine$/ );

					expect( currentVersionStub.calledTwice ).to.equal( true );
					expect( newReleaseTypeStub.calledTwice ).to.equal( true );
					expect( nextVersionStub.calledTwice ).to.equal( true );

					expect( versions ).to.deep.equal( {
						'ckeditor5-core': '0.6.0',
						'ckeditor5-engine': '1.0.1'
					} );

					expect( execOptions ).to.deep.equal( options );
				} );
		} );
	} );
} );
