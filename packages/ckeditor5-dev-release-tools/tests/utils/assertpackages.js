/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
	describe( 'assertPackages()', () => {
		let assertPackages, sandbox, stubs;

		const disableMainValidatorOptions = {
			requireEntryPoint: false,
			optionalEntryPointPackages: []
		};

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				fs: {
					pathExists: sandbox.stub(),
					readJson: sandbox.stub()
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );

			assertPackages = require( '../../lib/utils/assertpackages' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should resolve the promise if list of packages is empty', () => {
			return assertPackages( [], { ...disableMainValidatorOptions } );
		} );

		it( 'should check if `package.json` exists in each package', () => {
			stubs.fs.pathExists.resolves( true );

			return assertPackages( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], { ...disableMainValidatorOptions } )
				.then( () => {
					expect( stubs.fs.pathExists.callCount ).to.equal( 3 );
					expect( stubs.fs.pathExists.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-foo/package.json' );
					expect( stubs.fs.pathExists.secondCall.args[ 0 ] ).to.equal( 'ckeditor5-bar/package.json' );
					expect( stubs.fs.pathExists.thirdCall.args[ 0 ] ).to.equal( 'ckeditor5-baz/package.json' );
				} );
		} );

		it( 'should throw one error for all packages with missing `package.json` file', () => {
			stubs.fs.pathExists
				.resolves( false )
				.withArgs( 'ckeditor5-bar/package.json' ).resolves( true );

			return assertPackages( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], { ...disableMainValidatorOptions } )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'The "package.json" file is missing in the "ckeditor5-foo" package.\n' +
							'The "package.json" file is missing in the "ckeditor5-baz" package.'
						);
					} );
		} );

		// See: https://github.com/ckeditor/ckeditor5/issues/15127.
		describe( 'the entry package point validator', () => {
			const enableMainValidatorOptions = {
				requireEntryPoint: true,
				optionalEntryPointPackages: [
					'@ckeditor/ckeditor5-bar'
				]
			};

			it( 'should throw if a package misses its entry point', () => {
				stubs.fs.pathExists.resolves( true );
				stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
					name: '@ckeditor/ckeditor5-foo',
					main: 'src/index.ts'
				} );
				stubs.fs.readJson.withArgs( 'ckeditor5-bar/package.json' ).resolves( {
					name: '@ckeditor/ckeditor5-bar'
				} );
				stubs.fs.readJson.withArgs( 'ckeditor5-baz/package.json' ).resolves( {
					name: '@ckeditor/ckeditor5-baz'
				} );

				return assertPackages( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], { ...enableMainValidatorOptions } )
					.then(
						() => {
							throw new Error( 'Expected to be rejected.' );
						},
						error => {
							expect( error ).to.be.an( 'Error' );
							expect( error.message ).to.equal(
								'The "@ckeditor/ckeditor5-baz" package misses the entry point ("main") definition in its "package.json".'
							);
						} );
			} );

			it( 'should pass the validator if specified package does not have to define the entry point', () => {
				stubs.fs.pathExists.resolves( true );
				stubs.fs.readJson.withArgs( 'ckeditor5-bar/package.json' ).resolves( {
					name: '@ckeditor/ckeditor5-bar'
				} );

				return assertPackages( [ 'ckeditor5-bar' ], { ...enableMainValidatorOptions } );
			} );
		} );
	} );
} );
