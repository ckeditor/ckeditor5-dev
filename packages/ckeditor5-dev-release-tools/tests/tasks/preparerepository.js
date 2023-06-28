/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/tasks', () => {
	describe( 'prepareRepository()', () => {
		const packages = [
			'ckeditor5-core',
			'ckeditor5-utils'
		];

		let options, stubs, prepareRepository;

		beforeEach( () => {
			options = {
				outputDirectory: 'release'
			};

			function stubReject( stubName, args ) {
				if ( args.length === 0 ) {
					throw new Error( `Stub "${ stubName }" expected to receive an argument.` );
				}

				throw new Error( `No output configured for stub "${ stubName }" with the following args: ${ JSON.stringify( args ) }` );
			}

			stubs = {
				fs: {
					copy: sinon.stub().resolves(),
					ensureDir: sinon.stub().resolves(),
					writeJson: sinon.stub().resolves(),

					// These stubs will reject calls without predefined arguments.
					lstat: sinon.stub().callsFake( ( ...args ) => stubReject( 'fs.lstat', args ) ),
					exists: sinon.stub().callsFake( ( ...args ) => stubReject( 'fs.exists', args ) ),
					readdir: sinon.stub().callsFake( ( ...args ) => stubReject( 'fs.readdir', args ) )
				},
				glob: {
					sync: sinon.stub().callsFake( ( ...args ) => stubReject( 'glob.sync', args ) )
				},
				lstat: {
					isDir: {
						isDirectory: sinon.stub().returns( true )
					},
					isNotDir: {
						isDirectory: sinon.stub().returns( false )
					}
				},
				process: {
					cwd: sinon.stub( process, 'cwd' ).returns( 'current/working/dir' )
				}
			};

			stubs.fs.readdir.withArgs( 'current/working/dir/release' ).resolves( [] );
			stubs.fs.readdir.withArgs( 'current/working/dir/packages' ).resolves( packages );

			stubs.glob.sync.withArgs( [ 'src/*.js', 'CHANGELOG.md' ] ).returns( [
				'current/working/dir/src/core.js',
				'current/working/dir/src/utils.js',
				'current/working/dir/CHANGELOG.md'
			] );

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );
			mockery.registerMock( 'glob', stubs.glob );

			prepareRepository = require( '../../lib/tasks/preparerepository' );
		} );

		afterEach( () => {
			mockery.deregisterAll();
			mockery.disable();
			sinon.restore();
		} );

		it( 'should be a function', () => {
			expect( prepareRepository ).to.be.a( 'function' );
		} );

		it( 'should do nothing if neither "rootPackage" or "packagesDirectory" options are defined', async () => {
			await prepareRepository( options );

			expect( stubs.fs.copy.callCount ).to.equal( 0 );
			expect( stubs.fs.ensureDir.callCount ).to.equal( 0 );
			expect( stubs.fs.writeJson.callCount ).to.equal( 0 );
		} );

		it( 'should ensure the existence of the output directory', async () => {
			stubs.fs.readdir.withArgs( 'current/working/dir/packages' ).resolves( [] );
			options.packagesDirectory = 'packages';

			await prepareRepository( options );

			expect( stubs.fs.ensureDir.callCount ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/release' );
		} );

		it( 'should throw if the output directory is not empty', async () => {
			stubs.fs.readdir.withArgs( 'current/working/dir/release' ).resolves( [ 'someFile.txt' ] );
			stubs.fs.readdir.withArgs( 'current/working/dir/packages' ).resolves( [] );
			options.packagesDirectory = 'packages';

			await prepareRepository( options )
				.then(
					() => {
						throw new Error( 'Expected to throw.' );
					},
					err => {
						expect( err.message ).to.equal( 'Output directory is not empty: "current/working/dir/release".' );
					}
				);

			expect( stubs.fs.ensureDir.callCount ).to.equal( 1 );
			expect( stubs.fs.readdir.callCount ).to.equal( 1 );
			expect( stubs.fs.copy.callCount ).to.equal( 0 );
		} );

		it( 'should use the "cwd" option if provided instead of the default "process.cwd()" value', async () => {
			stubs.fs.readdir.withArgs( 'custom/working/dir/release' ).resolves( [] );
			stubs.fs.readdir.withArgs( 'custom/working/dir/packages' ).resolves( [] );
			options.cwd = 'custom/working/dir';
			options.packagesDirectory = 'packages';

			await prepareRepository( options );

			expect( stubs.fs.ensureDir.callCount ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args[ 0 ] ).to.equal( 'custom/working/dir/release' );
		} );

		it( 'should normalize Windows slashes "\\" from "process.cwd()"', async () => {
			stubs.fs.readdir.withArgs( 'windows/working/dir/release' ).resolves( [] );
			stubs.fs.readdir.withArgs( 'windows/working/dir/packages' ).resolves( [] );
			stubs.process.cwd.returns( 'windows\\working\\dir' );
			options.packagesDirectory = 'packages';

			await prepareRepository( options );

			expect( stubs.fs.ensureDir.callCount ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args[ 0 ] ).to.equal( 'windows/working/dir/release' );
		} );

		describe( 'root package processing', () => {
			it( 'should create "package.json" file in the root package with provided values', async () => {
				options.rootPackageJson = {
					name: 'CKEditor5',
					description: 'Foo bar baz.',
					keywords: [ 'foo', 'bar', 'baz' ],
					files: [ 'src/*.js', 'CHANGELOG.md' ]
				};

				await prepareRepository( options );

				expect( stubs.fs.writeJson.callCount ).to.equal( 1 );
				expect( stubs.fs.writeJson.getCall( 0 ).args.length ).to.equal( 3 );
				expect( stubs.fs.writeJson.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/release/CKEditor5/package.json' );
				expect( stubs.fs.writeJson.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					name: 'CKEditor5',
					description: 'Foo bar baz.',
					keywords: [ 'foo', 'bar', 'baz' ],
					files: [ 'src/*.js', 'CHANGELOG.md' ]
				} );
				expect( stubs.fs.writeJson.getCall( 0 ).args[ 2 ] ).to.deep.equal( { spaces: 2, EOL: '\n' } );
			} );

			it( 'should create a flat output file structure for a scoped package', async () => {
				options.rootPackageJson = {
					name: '@ckeditor/CKEditor5',
					files: [ 'src/*.js', 'CHANGELOG.md' ]
				};

				await prepareRepository( options );

				expect( stubs.fs.writeJson.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/release/CKEditor5/package.json' );
			} );

			it( 'should copy specified files of the root package', async () => {
				options.rootPackageJson = {
					name: 'CKEditor5',
					description: 'Foo bar baz.',
					keywords: [ 'foo', 'bar', 'baz' ],
					files: [ 'src/*.js', 'CHANGELOG.md' ]
				};

				await prepareRepository( options );

				expect( stubs.fs.copy.callCount ).to.equal( 3 );

				expect( stubs.fs.copy.getCall( 0 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/src/core.js' );
				expect( stubs.fs.copy.getCall( 0 ).args[ 1 ] ).to.equal( 'current/working/dir/release/CKEditor5/src/core.js' );

				expect( stubs.fs.copy.getCall( 1 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 1 ).args[ 0 ] ).to.equal( 'current/working/dir/src/utils.js' );
				expect( stubs.fs.copy.getCall( 1 ).args[ 1 ] ).to.equal( 'current/working/dir/release/CKEditor5/src/utils.js' );

				expect( stubs.fs.copy.getCall( 2 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 2 ).args[ 0 ] ).to.equal( 'current/working/dir/CHANGELOG.md' );
				expect( stubs.fs.copy.getCall( 2 ).args[ 1 ] ).to.equal( 'current/working/dir/release/CKEditor5/CHANGELOG.md' );
			} );

			it( 'should throw if "rootPackageJson" is missing the "name" field', async () => {
				options.rootPackageJson = {
					description: 'Foo bar baz.',
					keywords: [ 'foo', 'bar', 'baz' ],
					files: [ 'src/*.js', 'CHANGELOG.md' ]
				};

				await prepareRepository( options )
					.then(
						() => {
							throw new Error( 'Expected to throw.' );
						},
						err => {
							expect( err.message ).to.equal( '"rootPackageJson" option object must have a "name" field.' );
						}
					);

				expect( stubs.fs.writeJson.callCount ).to.equal( 0 );
				expect( stubs.fs.copy.callCount ).to.equal( 0 );
			} );

			it( 'should throw if "rootPackageJson" is missing the "files" field', async () => {
				options.rootPackageJson = {
					name: 'CKEditor5',
					description: 'Foo bar baz.',
					keywords: [ 'foo', 'bar', 'baz' ]
				};

				await prepareRepository( options )
					.then(
						() => {
							throw new Error( 'Expected to throw.' );
						},
						err => {
							expect( err.message ).to.equal( '"rootPackageJson" option object must have a "files" field.' );
						}
					);

				expect( stubs.fs.writeJson.callCount ).to.equal( 0 );
				expect( stubs.fs.copy.callCount ).to.equal( 0 );
			} );
		} );

		describe( 'monorepository packages processing', () => {
			it( 'should copy files of all packages', async () => {
				options.packagesDirectory = 'packages';

				stubs.fs.lstat.withArgs( 'current/working/dir/packages/ckeditor5-core' ).resolves( stubs.lstat.isDir );
				stubs.fs.lstat.withArgs( 'current/working/dir/packages/ckeditor5-utils' ).resolves( stubs.lstat.isDir );
				stubs.fs.exists.withArgs( 'current/working/dir/packages/ckeditor5-core/package.json' ).resolves( true );
				stubs.fs.exists.withArgs( 'current/working/dir/packages/ckeditor5-utils/package.json' ).resolves( true );

				await prepareRepository( options );

				expect( stubs.fs.copy.callCount ).to.equal( 2 );

				expect( stubs.fs.copy.getCall( 0 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-core' );
				expect( stubs.fs.copy.getCall( 0 ).args[ 1 ] ).to.equal( 'current/working/dir/release/ckeditor5-core' );

				expect( stubs.fs.copy.getCall( 1 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 1 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-utils' );
				expect( stubs.fs.copy.getCall( 1 ).args[ 1 ] ).to.equal( 'current/working/dir/release/ckeditor5-utils' );
			} );

			it( 'should not copy non-directories', async () => {
				options.packagesDirectory = 'packages';

				stubs.fs.readdir.withArgs( 'current/working/dir/packages' ).resolves( [ ...packages, 'textFile.txt' ] );

				stubs.fs.lstat.withArgs( 'current/working/dir/packages/ckeditor5-core' ).resolves( stubs.lstat.isDir );
				stubs.fs.lstat.withArgs( 'current/working/dir/packages/ckeditor5-utils' ).resolves( stubs.lstat.isDir );
				stubs.fs.lstat.withArgs( 'current/working/dir/packages/textFile.txt' ).resolves( stubs.lstat.isNotDir );
				stubs.fs.exists.withArgs( 'current/working/dir/packages/ckeditor5-core/package.json' ).resolves( true );
				stubs.fs.exists.withArgs( 'current/working/dir/packages/ckeditor5-utils/package.json' ).resolves( true );

				await prepareRepository( options );

				expect( stubs.fs.copy.callCount ).to.equal( 2 );

				expect( stubs.fs.copy.getCall( 0 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-core' );
				expect( stubs.fs.copy.getCall( 0 ).args[ 1 ] ).to.equal( 'current/working/dir/release/ckeditor5-core' );

				expect( stubs.fs.copy.getCall( 1 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 1 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-utils' );
				expect( stubs.fs.copy.getCall( 1 ).args[ 1 ] ).to.equal( 'current/working/dir/release/ckeditor5-utils' );
			} );

			it( 'should not copy directories that do not have the "package.json" file', async () => {
				options.packagesDirectory = 'packages';

				stubs.fs.lstat.withArgs( 'current/working/dir/packages/ckeditor5-core' ).resolves( stubs.lstat.isDir );
				stubs.fs.lstat.withArgs( 'current/working/dir/packages/ckeditor5-utils' ).resolves( stubs.lstat.isDir );
				stubs.fs.exists.withArgs( 'current/working/dir/packages/ckeditor5-core/package.json' ).resolves( true );
				stubs.fs.exists.withArgs( 'current/working/dir/packages/ckeditor5-utils/package.json' ).resolves( false );

				await prepareRepository( options );

				expect( stubs.fs.copy.callCount ).to.equal( 1 );

				expect( stubs.fs.copy.getCall( 0 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-core' );
				expect( stubs.fs.copy.getCall( 0 ).args[ 1 ] ).to.equal( 'current/working/dir/release/ckeditor5-core' );
			} );

			it( 'should copy only the specified packages if the "packagesToCopy" option is provided', async () => {
				options.packagesDirectory = 'packages';
				options.packagesToCopy = [ 'ckeditor5-core' ];

				stubs.fs.lstat.withArgs( 'current/working/dir/packages/ckeditor5-core' ).resolves( stubs.lstat.isDir );
				stubs.fs.exists.withArgs( 'current/working/dir/packages/ckeditor5-core/package.json' ).resolves( true );

				await prepareRepository( options );

				expect( stubs.fs.copy.callCount ).to.equal( 1 );

				expect( stubs.fs.copy.getCall( 0 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-core' );
				expect( stubs.fs.copy.getCall( 0 ).args[ 1 ] ).to.equal( 'current/working/dir/release/ckeditor5-core' );
			} );

			it( 'should allow copying nested packages via the "packagesToCopy" option', async () => {
				options.packagesDirectory = 'packages';
				options.packagesToCopy = [ 'nested/ckeditor5-nested' ];

				stubs.fs.lstat.withArgs( 'current/working/dir/packages/nested/ckeditor5-nested' ).resolves( stubs.lstat.isDir );
				stubs.fs.exists.withArgs( 'current/working/dir/packages/nested/ckeditor5-nested/package.json' ).resolves( true );

				await prepareRepository( options );

				expect( stubs.fs.copy.callCount ).to.equal( 1 );

				expect( stubs.fs.copy.getCall( 0 ).args.length ).to.equal( 2 );
				expect( stubs.fs.copy.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/nested/ckeditor5-nested' );
				expect( stubs.fs.copy.getCall( 0 ).args[ 1 ] ).to.equal( 'current/working/dir/release/nested/ckeditor5-nested' );
			} );
		} );
	} );
} );
