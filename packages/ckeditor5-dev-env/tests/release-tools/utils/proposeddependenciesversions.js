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

describe( 'dev-env/release-tools/utils', () => {
	describe( 'proposedDependenciesVersions()', () => {
		let proposedDepsVersion, sandbox, execOptions;
		let mockCalled = {
			getNextVersion: false,
			getNewReleaseType: false,
			getCurrentVersion: false
		};

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( './executeondependencies', ( options, functionToExecute ) => {
				execOptions = options;

				const workspacePath = path.join( options.cwd, options.workspace );

				return Promise.resolve()
					.then( () => functionToExecute( 'ckeditor5-core', path.join( workspacePath, 'ckeditor5-core' ) ) )
					.then( () => functionToExecute( '@ckeditor/ckeditor5-engine', path.join( workspacePath, 'ckeditor5-engine' ) ) );
			} );

			mockery.registerMock( './getnextversion', () => {
				if ( mockCalled.getNextVersion ) {
					return '1.0.1';
				}

				mockCalled.getNextVersion = true;

				return '0.6.0';
			} );

			mockery.registerMock( './getnewreleasetype', () => {
				if ( mockCalled.getNewReleaseType ) {
					return Promise.resolve( { releaseType: 'patch' } );
				}

				mockCalled.getNewReleaseType = true;

				return Promise.resolve( { releaseType: 'minor' } );
			} );

			mockery.registerMock( './getcurrentversion', () => {
				if ( mockCalled.getCurrentVersion ) {
					return 'v1.0.0';
				}

				mockCalled.getCurrentVersion = true;

				return 'v0.5.0';
			} );

			proposedDepsVersion = require( '../../../lib/release-tools/utils/proposeddependenciesversions' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'returns proposed versions for next release', () => {
			const chdirStub = sandbox.stub( process, 'chdir' );
			const cwd = path.join( __dirname, '..', 'fixtures' );

			const options = {
				cwd,
				workspace: 'packages/'
			};

			return proposedDepsVersion( options )
				.then( ( versions ) => {
					expect( chdirStub.calledThrice ).to.equal( true );
					expect( chdirStub.firstCall.args[ 0 ] ).to.match( /ckeditor5-core$/ );
					expect( chdirStub.secondCall.args[ 0 ] ).to.match( /ckeditor5-engine$/ );
					expect( chdirStub.thirdCall.args[ 0 ] ).to.equal( cwd );

					expect( mockCalled.getNextVersion ).to.equal( true );
					expect( mockCalled.getCurrentVersion ).to.equal( true );
					expect( mockCalled.getNewReleaseType ).to.equal( true );

					expect( versions ).to.deep.equal( {
						'ckeditor5-core': '0.6.0',
						'@ckeditor/ckeditor5-engine': '1.0.1'
					} );

					expect( execOptions ).to.deep.equal( options );
				} );
		} );
	} );
} );
