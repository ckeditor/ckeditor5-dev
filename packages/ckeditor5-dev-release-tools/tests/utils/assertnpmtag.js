/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
	describe( 'assertNpmTag()', () => {
		let assertNpmTag, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				fs: {
					readJson: sandbox.stub()
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );

			assertNpmTag = require( '../../lib/utils/assertnpmtag' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should resolve the promise if list of packages is empty', () => {
			return assertNpmTag( [] );
		} );

		it( 'should read `package.json` from each package', () => {
			stubs.fs.readJson
				.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
					name: 'ckeditor5-foo',
					version: '1.0.0'
				} )
				.withArgs( 'ckeditor5-bar/package.json' ).resolves( {
					name: 'ckeditor5-bar',
					version: '0.0.1'
				} );

			return assertNpmTag( [ 'ckeditor5-foo', 'ckeditor5-bar' ], 'latest' )
				.then( () => {
					expect( stubs.fs.readJson.callCount ).to.equal( 2 );
					expect( stubs.fs.readJson.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-foo/package.json' );
					expect( stubs.fs.readJson.secondCall.args[ 0 ] ).to.equal( 'ckeditor5-bar/package.json' );
				} );
		} );

		it( 'should not throw if version tag matches npm tag (both "latest")', () => {
			stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				version: '1.0.0'
			} );

			return assertNpmTag( [ 'ckeditor5-foo' ], 'latest' );
		} );

		it( 'should not throw if version tag matches npm tag (version tag = "latest", npm tag = "staging")', () => {
			stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				version: '1.0.0'
			} );

			return assertNpmTag( [ 'ckeditor5-foo' ], 'staging' );
		} );

		it( 'should not throw if version tag matches npm tag (both "alpha")', () => {
			stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				version: '1.0.0-alpha.0'
			} );

			return assertNpmTag( [ 'ckeditor5-foo' ], 'alpha' );
		} );

		it( 'should not throw if version tag matches npm tag (both "nightly")', () => {
			stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				version: '0.0.0-nightly-20230517.0'
			} );

			return assertNpmTag( [ 'ckeditor5-foo' ], 'nightly' );
		} );

		it( 'should throw if version tag does not match npm tag (version tag = "latest", npm tag = "alpha")', () => {
			stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				version: '1.0.0'
			} );

			return assertNpmTag( [ 'ckeditor5-foo' ], 'alpha' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'The version tag "latest" from "ckeditor5-foo" package does not match the npm tag "alpha".'
						);
					} );
		} );

		it( 'should throw if version tag does not match npm tag (version tag = "latest", npm tag = "nightly")', () => {
			stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				version: '1.0.0'
			} );

			return assertNpmTag( [ 'ckeditor5-foo' ], 'nightly' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'The version tag "latest" from "ckeditor5-foo" package does not match the npm tag "nightly".'
						);
					} );
		} );

		it( 'should throw if version tag does not match npm tag (version tag = "alpha", npm tag = "staging")', () => {
			stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				version: '1.0.0-alpha.0'
			} );

			return assertNpmTag( [ 'ckeditor5-foo' ], 'staging' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'The version tag "alpha" from "ckeditor5-foo" package does not match the npm tag "staging".'
						);
					} );
		} );

		it( 'should throw if version tag does not match npm tag (version tag = "nightly", npm tag = "staging")', () => {
			stubs.fs.readJson.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
				name: 'ckeditor5-foo',
				version: '0.0.0-nightly-20230517.0'
			} );

			return assertNpmTag( [ 'ckeditor5-foo' ], 'staging' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'The version tag "nightly" from "ckeditor5-foo" package does not match the npm tag "staging".'
						);
					} );
		} );

		it( 'should throw one error for all packages with incorrect tags', () => {
			stubs.fs.readJson
				.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
					name: 'ckeditor5-foo',
					version: '1.0.0-alpha'
				} )
				.withArgs( 'ckeditor5-bar/package.json' ).resolves( {
					name: 'ckeditor5-bar',
					version: '0.0.0-nightly-20230517.0'
				} )
				.withArgs( 'ckeditor5-baz/package.json' ).resolves( {
					name: 'ckeditor5-baz',
					version: '0.0.1-rc.5'
				} );

			return assertNpmTag( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ], 'latest' )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'The version tag "alpha" from "ckeditor5-foo" package does not match the npm tag "latest".\n' +
							'The version tag "nightly" from "ckeditor5-bar" package does not match the npm tag "latest".\n' +
							'The version tag "rc" from "ckeditor5-baz" package does not match the npm tag "latest".'
						);
					} );
		} );
	} );
} );
