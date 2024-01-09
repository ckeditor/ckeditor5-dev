/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
	describe( 'assertFilesToPublish()', () => {
		let assertFilesToPublish, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				fs: {
					readJson: sandbox.stub()
				},
				glob: {
					glob: sandbox.stub()
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );
			mockery.registerMock( 'glob', stubs.glob );

			assertFilesToPublish = require( '../../lib/utils/assertfilestopublish' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sandbox.restore();
		} );

		it( 'should do nothing if list of packages is empty', () => {
			return assertFilesToPublish( [] )
				.then( () => {
					expect( stubs.fs.readJson.called ).to.equal( false );
					expect( stubs.glob.glob.called ).to.equal( false );
				} );
		} );

		it( 'should read `package.json` from each package', () => {
			stubs.fs.readJson.resolves( {} );

			return assertFilesToPublish( [ 'ckeditor5-foo', 'ckeditor5-bar' ] )
				.then( () => {
					expect( stubs.fs.readJson.callCount ).to.equal( 2 );
					expect( stubs.fs.readJson.firstCall.args[ 0 ] ).to.equal( 'ckeditor5-foo/package.json' );
					expect( stubs.fs.readJson.secondCall.args[ 0 ] ).to.equal( 'ckeditor5-bar/package.json' );
				} );
		} );

		it( 'should not check any file if `package.json` does not contain required files', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo'
			} );

			return assertFilesToPublish( [ 'ckeditor5-foo' ] )
				.then( () => {
					expect( stubs.glob.glob.called ).to.equal( false );
				} );
		} );

		it( 'should not throw if all files from `files` field exist', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				files: [
					'src',
					'README.md'
				]
			} );

			stubs.glob.glob
				.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
				.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [ 'README.md' ] );

			return assertFilesToPublish( [ 'ckeditor5-foo' ] )
				.then( () => {
					expect( stubs.glob.glob.callCount ).to.equal( 2 );
					expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
					expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-foo' );
					expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'dot', true );
					expect( stubs.glob.glob.firstCall.args[ 1 ] ).to.have.property( 'nodir', true );
					expect( stubs.glob.glob.secondCall.args[ 0 ] ).to.deep.equal( [ 'README.md', 'README.md/**' ] );
					expect( stubs.glob.glob.secondCall.args[ 1 ] ).to.have.property( 'cwd', 'ckeditor5-foo' );
					expect( stubs.glob.glob.secondCall.args[ 1 ] ).to.have.property( 'dot', true );
					expect( stubs.glob.glob.secondCall.args[ 1 ] ).to.have.property( 'nodir', true );
				} );
		} );

		it( 'should not throw if all files from `files` field exist except the optional ones (for package)', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				files: [
					'src',
					'README.md'
				]
			} );

			stubs.glob.glob
				.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
				.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [ 'README.md' ] );

			const optionalEntries = {
				'ckeditor5-foo': [
					'README.md'
				]
			};

			return assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries )
				.then( () => {
					expect( stubs.glob.glob.callCount ).to.equal( 1 );
					expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
				} );
		} );

		it( 'should not throw if all files from `files` field exist except the optional ones (for all packages)', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				files: [
					'src',
					'README.md'
				]
			} );

			stubs.glob.glob
				.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
				.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [] );

			const optionalEntries = {
				'default': [
					'README.md'
				]
			};

			return assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries )
				.then( () => {
					expect( stubs.glob.glob.callCount ).to.equal( 1 );
					expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
				} );
		} );

		it( 'should prefer own configuration for optional entries', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				files: [
					'src',
					'README.md'
				]
			} );

			stubs.glob.glob
				.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
				.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [ 'README.md' ] );

			const optionalEntries = {
				// Make all entries as required for the "ckeditor5-foo" package.
				'ckeditor5-foo': [],
				'default': [
					'README.md'
				]
			};

			return assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries )
				.then( () => {
					expect( stubs.glob.glob.callCount ).to.equal( 2 );
					expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
					expect( stubs.glob.glob.secondCall.args[ 0 ] ).to.deep.equal( [ 'README.md', 'README.md/**' ] );
				} );
		} );

		it( 'should consider entry as required if there are not matches in optional entries', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				files: [
					'src',
					'README.md'
				]
			} );

			stubs.glob.glob
				.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
				.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [ 'README.md' ] );

			const optionalEntries = {
				'ckeditor5-bar': [
					'src',
					'README.md'
				]
			};

			return assertFilesToPublish( [ 'ckeditor5-foo' ], optionalEntries )
				.then( () => {
					expect( stubs.glob.glob.callCount ).to.equal( 2 );
					expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
					expect( stubs.glob.glob.secondCall.args[ 0 ] ).to.deep.equal( [ 'README.md', 'README.md/**' ] );
				} );
		} );

		it( 'should not throw if `main` file exists', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				main: 'src/index.ts',
				files: [
					'src',
					'README.md'
				]
			} );

			stubs.glob.glob
				.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
				.withArgs( [ 'src/index.ts', 'src/index.ts/**' ] ).resolves( [ 'src/index.ts' ] )
				.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [ 'README.md' ] );

			return assertFilesToPublish( [ 'ckeditor5-foo' ] )
				.then( () => {
					expect( stubs.glob.glob.callCount ).to.equal( 3 );
					expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src/index.ts', 'src/index.ts/**' ] );
					expect( stubs.glob.glob.secondCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
					expect( stubs.glob.glob.thirdCall.args[ 0 ] ).to.deep.equal( [ 'README.md', 'README.md/**' ] );
				} );
		} );

		it( 'should not throw if `types` file exists', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				types: 'src/index.d.ts',
				files: [
					'src',
					'README.md'
				]
			} );

			stubs.glob.glob
				.withArgs( [ 'src', 'src/**' ] ).resolves( [ 'src/index.ts' ] )
				.withArgs( [ 'src/index.d.ts', 'src/index.d.ts/**' ] ).resolves( [ 'src/index.d.ts' ] )
				.withArgs( [ 'README.md', 'README.md/**' ] ).resolves( [ 'README.md' ] );

			return assertFilesToPublish( [ 'ckeditor5-foo' ] )
				.then( () => {
					expect( stubs.glob.glob.callCount ).to.equal( 3 );
					expect( stubs.glob.glob.firstCall.args[ 0 ] ).to.deep.equal( [ 'src/index.d.ts', 'src/index.d.ts/**' ] );
					expect( stubs.glob.glob.secondCall.args[ 0 ] ).to.deep.equal( [ 'src', 'src/**' ] );
					expect( stubs.glob.glob.thirdCall.args[ 0 ] ).to.deep.equal( [ 'README.md', 'README.md/**' ] );
				} );
		} );

		it( 'should throw if not all files from `files` field exist', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				files: [
					'src',
					'LICENSE.md',
					'README.md'
				]
			} );

			stubs.glob.glob.resolves( [] );

			return assertFilesToPublish( [ 'ckeditor5-foo' ] )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'Missing files in "ckeditor5-foo" package for entries: "src", "LICENSE.md", "README.md"'
						);
					} );
		} );

		it( 'should throw if file from `main` field does not exist', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				main: 'src/index.ts'
			} );

			stubs.glob.glob.resolves( [] );

			return assertFilesToPublish( [ 'ckeditor5-foo' ] )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'Missing files in "ckeditor5-foo" package for entries: "src/index.ts"'
						);
					} );
		} );

		it( 'should throw if file from `types` field does not exist', () => {
			stubs.fs.readJson.resolves( {
				name: 'ckeditor5-foo',
				types: 'src/index.d.ts'
			} );

			stubs.glob.glob.resolves( [] );

			return assertFilesToPublish( [ 'ckeditor5-foo' ] )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'Missing files in "ckeditor5-foo" package for entries: "src/index.d.ts"'
						);
					} );
		} );

		it( 'should throw one error for all packages with missing files', () => {
			stubs.fs.readJson
				.withArgs( 'ckeditor5-foo/package.json' ).resolves( {
					name: 'ckeditor5-foo',
					files: [
						'src'
					]
				} )
				.withArgs( 'ckeditor5-bar/package.json' ).resolves( {
					name: 'ckeditor5-bar',
					files: [
						'src',
						'README.md'
					]
				} )
				.withArgs( 'ckeditor5-baz/package.json' ).resolves( {
					name: 'ckeditor5-baz',
					files: [
						'src',
						'LICENSE.md',
						'README.md'
					]
				} );

			stubs.glob.glob.resolves( [] );

			return assertFilesToPublish( [ 'ckeditor5-foo', 'ckeditor5-bar', 'ckeditor5-baz' ] )
				.then(
					() => {
						throw new Error( 'Expected to be rejected.' );
					},
					error => {
						expect( error ).to.be.an( 'Error' );
						expect( error.message ).to.equal(
							'Missing files in "ckeditor5-foo" package for entries: "src"\n' +
							'Missing files in "ckeditor5-bar" package for entries: "src", "README.md"\n' +
							'Missing files in "ckeditor5-baz" package for entries: "src", "LICENSE.md", "README.md"'
						);
					} );
		} );
	} );
} );
