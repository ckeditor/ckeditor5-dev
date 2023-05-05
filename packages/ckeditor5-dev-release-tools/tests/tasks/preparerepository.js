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
		const pkgJsonTemplatePathPattern = /packages\/ckeditor5-dev-release-tools\/lib\/templates\/release-package\.json$/;

		const pkgJsonTemplate = {
			name: null,
			version: null,
			description: null,
			keywords: null,
			engines: null,
			author: null,
			license: null,
			homepage: null,
			bugs: null,
			repository: null
		};

		const packages = [
			'ckeditor5-core',
			'ckeditor5-utils'
		];

		let options, stubs, prepareRepository;

		beforeEach( () => {
			options = {
				pkgJsonContent: {
					name: 'CKEditor5',
					description: 'Foo bar baz.',
					keywords: [ 'foo', 'bar', 'baz' ]
				},
				rootFilesToCopy: [
					'src',
					'CHANGELOG.md'
				]
			};

			function stubReject( ...args ) {
				if ( args.length === 0 ) {
					throw new Error( 'Expected to receive an argument.' );
				}

				throw new Error( `No output configured for the following args: ${ args }` );
			}

			stubs = {
				fs: {
					ensureDir: sinon.stub().resolves(),
					writeJson: sinon.stub().resolves(),
					copy: sinon.stub().resolves(),

					readJson: sinon.stub().callsFake( stubReject ),
					readdir: sinon.stub().callsFake( stubReject )
				},
				process: {
					cwd: sinon.stub( process, 'cwd' ).returns( 'current/working/dir' )
				}
			};

			stubs.fs.readJson.withArgs( sinon.match( pkgJsonTemplatePathPattern ) ).resolves( pkgJsonTemplate );
			stubs.fs.readdir.withArgs( 'current/working/dir/packages' ).resolves( packages );

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );

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

		it( 'should ensure the existence of the output directory', async () => {
			await prepareRepository( options );

			expect( stubs.fs.ensureDir.callCount ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/release/packages' );
		} );

		it( 'should normalize Windows slashes `\\` from "process.cwd()"', async () => {
			stubs.fs.readdir.withArgs( 'windows/working/dir/packages' ).resolves( packages );
			stubs.process.cwd.returns( 'windows\\working\\dir' );

			await prepareRepository( options );

			expect( stubs.fs.ensureDir.callCount ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args[ 0 ] ).to.equal( 'windows/working/dir/release/packages' );
		} );

		it( 'should use the "cwd" option if provided instead of the default "process.cwd()" value', async () => {
			stubs.fs.readdir.withArgs( 'custom/working/dir/packages' ).resolves( packages );
			options.cwd = 'custom/working/dir';

			await prepareRepository( options );

			expect( stubs.fs.ensureDir.callCount ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args[ 0 ] ).to.equal( 'custom/working/dir/release/packages' );
		} );

		it( 'should use the "packagesDir" option if provided instead of the default "packages" value', async () => {
			stubs.fs.readdir.withArgs( 'current/working/dir/custom/packages/dir' ).resolves( packages );
			options.packagesDir = 'custom/packages/dir';

			await prepareRepository( options );

			expect( stubs.fs.ensureDir.callCount ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args.length ).to.equal( 1 );
			expect( stubs.fs.ensureDir.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/release/custom/packages/dir' );
		} );

		it( 'should write the root package "package.json" file', async () => {
			delete options.pkgJsonContent;

			await prepareRepository( options );

			expect( stubs.fs.writeJson.callCount ).to.equal( 1 );
			expect( stubs.fs.writeJson.getCall( 0 ).args.length ).to.equal( 3 );
			expect( stubs.fs.writeJson.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/release/package.json' );
			expect( stubs.fs.writeJson.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
				name: null,
				version: null,
				description: null,
				keywords: null,
				engines: null,
				author: null,
				license: null,
				homepage: null,
				bugs: null,
				repository: null
			} );
			expect( stubs.fs.writeJson.getCall( 0 ).args[ 2 ] ).to.deep.equal( {
				spaces: 2,
				EOL: '\n'
			} );
		} );

		it( 'should include provided values in the root package "package.json" file', async () => {
			await prepareRepository( options );

			expect( stubs.fs.writeJson.callCount ).to.equal( 1 );
			expect( stubs.fs.writeJson.getCall( 0 ).args.length ).to.equal( 3 );
			expect( stubs.fs.writeJson.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/release/package.json' );
			expect( stubs.fs.writeJson.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
				name: 'CKEditor5',
				version: null,
				description: 'Foo bar baz.',
				keywords: [ 'foo', 'bar', 'baz' ],
				engines: null,
				author: null,
				license: null,
				homepage: null,
				bugs: null,
				repository: null
			} );
			expect( stubs.fs.writeJson.getCall( 0 ).args[ 2 ] ).to.deep.equal( {
				spaces: 2,
				EOL: '\n'
			} );
		} );

		it( 'should copy specified files of the root package', async () => {
			await prepareRepository( options );

			expect( stubs.fs.copy.callCount ).to.equal( 4 );

			expect( stubs.fs.copy.getCall( 0 ).args.length ).to.equal( 2 );
			expect( stubs.fs.copy.getCall( 0 ).args[ 0 ] ).to.equal( 'current/working/dir/src' );
			expect( stubs.fs.copy.getCall( 0 ).args[ 1 ] ).to.equal( 'current/working/dir/release/src' );

			expect( stubs.fs.copy.getCall( 1 ).args.length ).to.equal( 2 );
			expect( stubs.fs.copy.getCall( 1 ).args[ 0 ] ).to.equal( 'current/working/dir/CHANGELOG.md' );
			expect( stubs.fs.copy.getCall( 1 ).args[ 1 ] ).to.equal( 'current/working/dir/release/CHANGELOG.md' );
		} );

		it( 'should copy files of all packages by default', async () => {
			await prepareRepository( options );

			expect( stubs.fs.copy.callCount ).to.equal( 4 );

			expect( stubs.fs.copy.getCall( 2 ).args.length ).to.equal( 2 );
			expect( stubs.fs.copy.getCall( 2 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-core' );
			expect( stubs.fs.copy.getCall( 2 ).args[ 1 ] ).to.equal( 'current/working/dir/release/packages/ckeditor5-core' );

			expect( stubs.fs.copy.getCall( 3 ).args.length ).to.equal( 2 );
			expect( stubs.fs.copy.getCall( 3 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-utils' );
			expect( stubs.fs.copy.getCall( 3 ).args[ 1 ] ).to.equal( 'current/working/dir/release/packages/ckeditor5-utils' );
		} );

		it( 'should copy files of specified packages', async () => {
			options.packagesToCopy = [
				'ckeditor5-specific-package',
				'nestedDirectory/ckeditor5-nested-package'
			];

			await prepareRepository( options );

			expect( stubs.fs.copy.callCount ).to.equal( 4 );

			expect( stubs.fs.copy.getCall( 2 ).args.length ).to.equal( 2 );
			expect( stubs.fs.copy.getCall( 2 ).args[ 0 ] ).to.equal( 'current/working/dir/packages/ckeditor5-specific-package' );
			expect( stubs.fs.copy.getCall( 2 ).args[ 1 ] ).to.equal( 'current/working/dir/release/packages/ckeditor5-specific-package' );

			expect( stubs.fs.copy.getCall( 3 ).args.length ).to.equal( 2 );
			expect( stubs.fs.copy.getCall( 3 ).args[ 0 ] ).to.equal(
				'current/working/dir/packages/nestedDirectory/ckeditor5-nested-package'
			);
			expect( stubs.fs.copy.getCall( 3 ).args[ 1 ] ).to.equal(
				'current/working/dir/release/packages/nestedDirectory/ckeditor5-nested-package'
			);
		} );
	} );
} );
