/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-env/index', () => {
	let tasks, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			translations: {
				uploadPotFiles: sandbox.stub(),
				download: sandbox.stub(),
				createPotFiles: sandbox.stub()
			},
			release: {
				releaseSubRepositories: sandbox.stub(),
				generateChangelogForSinglePackage: sandbox.stub(),
				generateChangelogForMonoRepository: sandbox.stub(),
				bumpVersions: sandbox.stub(),
				updateCKEditor5Dependencies: sandbox.stub()
			}
		};

		mockery.registerMock( './translations/upload', stubs.translations.uploadPotFiles );
		mockery.registerMock( './translations/download', stubs.translations.download );
		mockery.registerMock( './translations/createpotfiles', stubs.translations.createPotFiles );

		const releaseTools = stubs.release;

		mockery.registerMock( './release-tools/tasks/bumpversions', releaseTools.bumpVersions );
		mockery.registerMock( './release-tools/tasks/generatechangelogforsinglepackage', releaseTools.generateChangelogForSinglePackage );
		mockery.registerMock( './release-tools/tasks/releasesubrepositories', releaseTools.releaseSubRepositories );
		mockery.registerMock( './release-tools/tasks/generatechangelogformonorepository', releaseTools.generateChangelogForMonoRepository );
		mockery.registerMock( './release-tools/tasks/update-ckeditor5-dependencies', releaseTools.updateCKEditor5Dependencies );

		tasks = proxyquire( '../lib/index', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					return stubs.logger;
				}
			}
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'releaseSubRepositories()', () => {
		it( 'creates release for sub repositories', () => {
			stubs.release.releaseSubRepositories.resolves( { result: true } );

			return tasks.releaseSubRepositories( 'arg' )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.release.releaseSubRepositories.calledOnce ).to.equal( true );
					expect( stubs.release.releaseSubRepositories.firstCall.args[ 0 ] ).to.equal( 'arg' );
				} );
		} );
	} );

	describe( 'generateChangelogForSinglePackage()', () => {
		it( 'generates a changelog for package', () => {
			stubs.release.generateChangelogForSinglePackage.resolves( { result: true } );

			return tasks.generateChangelogForSinglePackage( 'arg' )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.release.generateChangelogForSinglePackage.calledOnce ).to.equal( true );
					expect( stubs.release.generateChangelogForSinglePackage.firstCall.args[ 0 ] ).to.equal( 'arg' );
				} );
		} );
	} );

	describe( 'generateChangelogForMonoRepository()', () => {
		it( 'generates a changelog for sub repositories', () => {
			stubs.release.generateChangelogForMonoRepository.resolves( { result: true } );

			return tasks.generateChangelogForMonoRepository( 123 )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.release.generateChangelogForMonoRepository.calledOnce ).to.equal( true );
					expect( stubs.release.generateChangelogForMonoRepository.firstCall.args[ 0 ] ).to.equal( 123 );
				} );
		} );
	} );

	describe( 'bumpVersions()', () => {
		it( 'updates version of dependencies', () => {
			stubs.release.bumpVersions.resolves( { result: true } );

			return tasks.bumpVersions( 123 )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.release.bumpVersions.calledOnce ).to.equal( true );
					expect( stubs.release.bumpVersions.firstCall.args[ 0 ] ).to.equal( 123 );
				} );
		} );
	} );

	describe( 'createPotFiles()', () => {
		it( 'should create a POT file', () => {
			stubs.translations.createPotFiles.returns( 'OK.' );

			const output = tasks.createPotFiles( {
				sourceFiles: [],
				packagePaths: [],
				corePackagePath: 'ckeditor5-core'
			} );

			sinon.assert.calledOnce( stubs.translations.createPotFiles );
			expect( output ).to.equal( 'OK.' );
		} );
	} );

	describe( 'updateCKEditor5Dependencies()', () => {
		it( 'should update versions in package.json files', () => {
			stubs.release.updateCKEditor5Dependencies.returns( 'OK.' );

			const output = tasks.updateCKEditor5Dependencies(
				[
					{ path: 'foo/packages', commit: true },
					{ path: 'bar/packages', commit: false }
				],
				process.argv.includes( '--dry-run' )
			);

			sinon.assert.calledOnce( stubs.release.updateCKEditor5Dependencies );
			sinon.assert.alwaysCalledWithExactly( stubs.release.updateCKEditor5Dependencies,
				[
					{ path: 'foo/packages', commit: true },
					{ path: 'bar/packages', commit: false }
				],
				process.argv.includes( '--dry-run' )
			);
			expect( output ).to.equal( 'OK.' );
		} );
	} );

	describe( 'uploadPotFiles()', () => {
		it( 'should upload translations', async () => {
			stubs.translations.uploadPotFiles.resolves( { status: true } );

			const response = await tasks.uploadPotFiles( {
				token: 'token',
				url: 'https://api.example.com',
				translationsDirectory: '/workspace'
			} );

			expect( response.status ).to.equal( true );

			sinon.assert.calledOnce( stubs.translations.uploadPotFiles );
			sinon.assert.alwaysCalledWithExactly( stubs.translations.uploadPotFiles, {
				token: 'token',
				url: 'https://api.example.com',
				translationsDirectory: '/workspace'
			} );
		} );
	} );

	describe( 'downloadTranslations()', () => {
		it( 'should download translations', async () => {
			stubs.translations.download.resolves( { status: true } );

			const packages = [];

			const response = await tasks.downloadTranslations( {
				packages,
				token: 'token',
				url: 'https://api.example.com',
				cwd: '/workspace'
			} );
			expect( response.status ).to.equal( true );

			sinon.assert.calledOnce( stubs.translations.download );
			sinon.assert.alwaysCalledWithExactly( stubs.translations.download, {
				packages,
				token: 'token',
				url: 'https://api.example.com',
				cwd: '/workspace'
			} );
		} );
	} );
} );
