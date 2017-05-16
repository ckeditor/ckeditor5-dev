/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils', () => {
	let cli, sandbox, questionItems;

	describe( 'cli', () => {
		beforeEach( () => {
			sandbox = sinon.sandbox.create();
			questionItems = [];

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'inquirer', {
				prompt( questions ) {
					questionItems.push( ...questions );
					const questionItem = questions[ 0 ];

					// Returns suggested value as a user input.
					return Promise.resolve( { version: questionItem.default } );
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
					.then( newVersion => {
						expect( newVersion ).to.equal( '2.0.0' );
					} );
			} );

			it( 'should suggest proper "minor" version for public package', () => {
				return cli.provideVersion( '1.0.0', 'minor' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '1.1.0' );
					} );
			} );

			it( 'should suggest proper "patch" version for public package', () => {
				return cli.provideVersion( '1.0.0', 'patch' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '1.0.1' );
					} );
			} );

			it( 'should suggest "skip" version for package which does not contain changes', () => {
				return cli.provideVersion( '1.0.0', null )
					.then( newVersion => {
						expect( newVersion ).to.equal( 'skip' );
					} );
			} );

			it( 'should suggest "minor" instead of "major" version for non-public package', () => {
				return cli.provideVersion( '0.7.0', 'major' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '0.8.0' );
					} );
			} );

			it( 'should suggest proper "patch" version for non-public package', () => {
				return cli.provideVersion( '0.7.0', 'patch' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '0.7.1' );
					} );
			} );
		} );

		describe( 'confirmRelease()', () => {
			it( 'displays packages and their versions (current and proposed) to release', () => {
				const packagesMap = new Map();

				packagesMap.set( '@ckeditor/ckeditor5-engine', {
					previousVersion: '1.0.0',
					version: '1.1.0'
				} );
				packagesMap.set( '@ckeditor/ckeditor5-core', {
					previousVersion: '0.7.0',
					version: '0.7.1'
				} );

				return cli.confirmRelease( packagesMap )
					.then( () => {
						const question = questionItems[ 0 ];

						expect( question.message ).to.match( /^Packages to release:/ );
						expect( question.message ).to.match( /"@ckeditor\/ckeditor5-engine": v1\.0\.0 => v1\.1\.0/ );
						expect( question.message ).to.match( /"@ckeditor\/ckeditor5-core": v0\.7\.0 => v0\.7\.1/ );
						expect( question.message ).to.match( /Continue\?$/ );
					} );
			} );

			it( 'sorts the packages alphabetically', () => {
				const packagesMap = new Map();

				packagesMap.set( '@ckeditor/ckeditor5-list', {} );
				packagesMap.set( '@ckeditor/ckeditor5-autoformat', {} );
				packagesMap.set( '@ckeditor/ckeditor5-basic-styles', {} );
				packagesMap.set( '@ckeditor/ckeditor5-core', {} );
				packagesMap.set( '@ckeditor/ckeditor5-link', {} );
				packagesMap.set( '@ckeditor/ckeditor5-build-classic', {} );

				return cli.confirmRelease( packagesMap )
					.then( () => {
						const packagesAsArray = questionItems[ 0 ].message
							.split( '\n' )
							// Remove header and footer from the message.
							.slice( 1, -1 )
							// Extract package name from the whole line.
							.map( line => line.replace( /.*"([^"]+)".*/, '$1' ) );

						expect( packagesAsArray.length ).to.equal( 6 );
						expect( packagesAsArray[ 0 ] ).to.equal( '@ckeditor/ckeditor5-autoformat' );
						expect( packagesAsArray[ 1 ] ).to.equal( '@ckeditor/ckeditor5-basic-styles' );
						expect( packagesAsArray[ 2 ] ).to.equal( '@ckeditor/ckeditor5-build-classic' );
						expect( packagesAsArray[ 3 ] ).to.equal( '@ckeditor/ckeditor5-core' );
						expect( packagesAsArray[ 4 ] ).to.equal( '@ckeditor/ckeditor5-link' );
						expect( packagesAsArray[ 5 ] ).to.equal( '@ckeditor/ckeditor5-list' );
					} );
			} );
		} );
	} );
} );
