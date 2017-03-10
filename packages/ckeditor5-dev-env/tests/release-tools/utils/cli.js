/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils', () => {
	let cli, sandbox;

	describe( 'cli', () => {
		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'inquirer', {
				prompt( questions ) {
					const questionItem = questions[ 0 ];

					if ( questionItem.name === 'version' ) {
						// Returns suggested version.
						return Promise.resolve( { version: questionItem.default } );
					}
				}
			} );

			cli = require( '../../../lib/release-tools/utils/cli' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		describe( 'provideVersion()', () => {
			it( 'should suggest proper "major" version for public package', () => {
				return cli.provideVersion( '1.0.0', 'major' )
					.then( ( newVersion ) => {
						expect( newVersion ).to.equal( '2.0.0' );
					} );
			} );

			it( 'should suggest proper "minor" version for public package', () => {
				return cli.provideVersion( '1.0.0', 'minor' )
					.then( ( newVersion ) => {
						expect( newVersion ).to.equal( '1.1.0' );
					} );
			} );

			it( 'should suggest proper "patch" version for public package', () => {
				return cli.provideVersion( '1.0.0', 'patch' )
					.then( ( newVersion ) => {
						expect( newVersion ).to.equal( '1.0.1' );
					} );
			} );

			it( 'should suggest "skip" version for package which does not contain changes', () => {
				return cli.provideVersion( '1.0.0', null )
					.then( ( newVersion ) => {
						expect( newVersion ).to.equal( 'skip' );
					} );
			} );

			it( 'should suggest "minor" instead of "major" version for non-public package', () => {
				return cli.provideVersion( '0.7.0', 'major' )
					.then( ( newVersion ) => {
						expect( newVersion ).to.equal( '0.8.0' );
					} );
			} );

			it( 'should suggest proper "patch" version for non-public package', () => {
				return cli.provideVersion( '0.7.0', 'patch' )
					.then( ( newVersion ) => {
						expect( newVersion ).to.equal( '0.7.1' );
					} );
			} );
		} );
	} );
} );
