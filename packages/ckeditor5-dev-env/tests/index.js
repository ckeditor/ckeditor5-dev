/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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
				uploadPotFiles: sandbox.spy(),
				download: sandbox.spy(),
				createPotFiles: sandbox.spy(),
				getToken: sandbox.stub()
			},
			release: {
				releaseSubRepositories: sandbox.stub(),
				generateChangelogForSinglePackage: sandbox.stub(),
				generateChangelogForMonoRepository: sandbox.stub(),
				bumpVersions: sandbox.stub()
			}
		};

		mockery.registerMock( './translations/upload', stubs.translations.uploadPotFiles );
		mockery.registerMock( './translations/gettoken', stubs.translations.getToken );
		mockery.registerMock( './translations/download', stubs.translations.download );
		mockery.registerMock( './translations/createpotfiles', stubs.translations.createPotFiles );

		const releaseTools = stubs.release;

		mockery.registerMock( './release-tools/tasks/bumpversions', releaseTools.bumpVersions );
		mockery.registerMock( './release-tools/tasks/generatechangelogforsinglepackage', releaseTools.generateChangelogForSinglePackage );
		mockery.registerMock( './release-tools/tasks/releasesubrepositories', releaseTools.releaseSubRepositories );
		mockery.registerMock( './release-tools/tasks/generatechangelogformonorepository', releaseTools.generateChangelogForMonoRepository );

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
			stubs.release.releaseSubRepositories.returns( Promise.resolve( { result: true } ) );

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
			stubs.release.generateChangelogForSinglePackage.returns( Promise.resolve( { result: true } ) );

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
			stubs.release.generateChangelogForMonoRepository.returns( Promise.resolve( { result: true } ) );

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
			stubs.release.bumpVersions.returns( Promise.resolve( { result: true } ) );

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
			tasks.createPotFiles( {
				sourceFiles: [],
				packagePaths: [],
				corePackagePath: 'ckeditor5-core'
			} );

			sinon.assert.calledOnce( stubs.translations.createPotFiles );
		} );
	} );

	describe( 'uploadPotFiles()', () => {
		it( 'should upload translations', () => {
			stubs.translations.getToken.returns( Promise.resolve( { token: 'token' } ) );

			return tasks.uploadPotFiles().then( () => {
				sinon.assert.calledOnce( stubs.translations.uploadPotFiles );
				sinon.assert.alwaysCalledWithExactly( stubs.translations.uploadPotFiles, {
					token: 'token'
				} );
			} );
		} );
	} );

	describe( 'downloadTranslations()', () => {
		it( 'should download translations', () => {
			stubs.translations.getToken.returns( Promise.resolve( { token: 'token' } ) );

			return tasks.downloadTranslations().then( () => {
				sinon.assert.calledOnce( stubs.translations.download );
				sinon.assert.alwaysCalledWithExactly( stubs.translations.download, {
					token: 'token'
				} );
			} );
		} );
	} );
} );
