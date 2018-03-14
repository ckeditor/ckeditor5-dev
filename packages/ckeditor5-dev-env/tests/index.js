/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
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
		sandbox = sinon.sandbox.create();

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
				uploadSourceFiles: sandbox.spy(),
				downloadTranslations: sandbox.spy(),
				generateSourceFiles: sandbox.spy(),
				uploadTranslations: sandbox.spy(),
				getToken: sandbox.stub()
			},
			releaseTools: {
				releaseRepository: sandbox.stub(),
				releaseSubRepositories: sandbox.stub(),
				generateChangelogForSinglePackage: sandbox.stub(),
				generateChangelogForSubPackages: sandbox.stub(),
				generateChangelogForSubRepositories: sandbox.stub(),
				generateSummaryChangelog: sandbox.stub()
			}
		};

		mockery.registerMock( './translations/uploadsourcefiles', stubs.translations.uploadSourceFiles );
		mockery.registerMock( './translations/gettoken', stubs.translations.getToken );
		mockery.registerMock( './translations/downloadtranslations', stubs.translations.downloadTranslations );
		mockery.registerMock( './translations/generatesourcefiles', stubs.translations.generateSourceFiles );
		mockery.registerMock( './translations/uploadtranslations', stubs.translations.uploadTranslations );

		mockery.registerMock(
			'./release-tools/tasks/releaserepository',
			stubs.releaseTools.releaseRepository
		);
		mockery.registerMock(
			'./release-tools/tasks/releasesubrepositories',
			stubs.releaseTools.releaseSubRepositories
		);
		mockery.registerMock(
			'./release-tools/tasks/generatechangelogforsinglepackage',
			stubs.releaseTools.generateChangelogForSinglePackage
		);
		mockery.registerMock(
			'./release-tools/tasks/generatechangelogforsubpackages',
			stubs.releaseTools.generateChangelogForSubPackages
		);
		mockery.registerMock(
			'./release-tools/tasks/generatechangelogforsubrepositories',
			stubs.releaseTools.generateChangelogForSubRepositories
		);
		mockery.registerMock(
			'./release-tools/tasks/generatesummarychangelog',
			stubs.releaseTools.generateSummaryChangelog
		);

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

	describe( 'releaseRepository()', () => {
		it( 'creates release for sub repository', () => {
			stubs.releaseTools.releaseRepository.returns( Promise.resolve( { result: true } ) );

			return tasks.releaseRepository( 'arg' )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.releaseTools.releaseRepository.calledOnce ).to.equal( true );
					expect( stubs.releaseTools.releaseRepository.firstCall.args[ 0 ] ).to.equal( 'arg' );
				} );
		} );
	} );

	describe( 'releaseSubRepositories()', () => {
		it( 'creates release for sub repositories', () => {
			stubs.releaseTools.releaseSubRepositories.returns( Promise.resolve( { result: true } ) );

			return tasks.releaseSubRepositories( 'arg' )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.releaseTools.releaseSubRepositories.calledOnce ).to.equal( true );
					expect( stubs.releaseTools.releaseSubRepositories.firstCall.args[ 0 ] ).to.equal( 'arg' );
				} );
		} );
	} );

	describe( 'generateChangelogForSinglePackage()', () => {
		it( 'generates a changelog for package', () => {
			stubs.releaseTools.generateChangelogForSinglePackage.returns( Promise.resolve( { result: true } ) );

			return tasks.generateChangelogForSinglePackage( 'arg' )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.releaseTools.generateChangelogForSinglePackage.calledOnce ).to.equal( true );
					expect( stubs.releaseTools.generateChangelogForSinglePackage.firstCall.args[ 0 ] ).to.equal( 'arg' );
				} );
		} );
	} );

	describe( 'generateChangelogForSubPackages()', () => {
		it( 'generates a changelog for sub packages', () => {
			stubs.releaseTools.generateChangelogForSubPackages.returns( Promise.resolve( { result: true } ) );

			return tasks.generateChangelogForSubPackages( 'arg' )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.releaseTools.generateChangelogForSubPackages.calledOnce ).to.equal( true );
					expect( stubs.releaseTools.generateChangelogForSubPackages.firstCall.args[ 0 ] ).to.equal( 'arg' );
				} );
		} );
	} );

	describe( 'generateChangelogForSubRepositories()', () => {
		it( 'generates a changelog for sub repositories', () => {
			stubs.releaseTools.generateChangelogForSubRepositories.returns( Promise.resolve( { result: true } ) );

			return tasks.generateChangelogForSubRepositories( 123 )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.releaseTools.generateChangelogForSubRepositories.calledOnce ).to.equal( true );
					expect( stubs.releaseTools.generateChangelogForSubRepositories.firstCall.args[ 0 ] ).to.equal( 123 );
				} );
		} );
	} );

	describe( 'generateSummaryChangelog()', () => {
		it( 'generates a changelog', () => {
			stubs.releaseTools.generateSummaryChangelog.returns( Promise.resolve( { result: true } ) );

			return tasks.generateSummaryChangelog( 123 )
				.then( response => {
					expect( response.result ).to.equal( true );
					expect( stubs.releaseTools.generateSummaryChangelog.calledOnce ).to.equal( true );
					expect( stubs.releaseTools.generateSummaryChangelog.firstCall.args[ 0 ] ).to.equal( 123 );
				} );
		} );
	} );

	describe( 'generateSourceFiles()', () => {
		it( 'should generate source files', () => {
			tasks.generateSourceFiles();

			sinon.assert.calledOnce( stubs.translations.generateSourceFiles );
		} );
	} );

	describe( 'uploadSourceFiles()', () => {
		it( 'should upload source files', () => {
			stubs.translations.getToken.returns( Promise.resolve( { token: 'token' } ) );

			return tasks.uploadSourceFiles().then( () => {
				sinon.assert.calledOnce( stubs.translations.uploadSourceFiles );
				sinon.assert.alwaysCalledWithExactly( stubs.translations.uploadSourceFiles, {
					token: 'token',
				} );
			} );
		} );
	} );

	describe( 'downloadTranslations()', () => {
		it( 'should download translations', () => {
			stubs.translations.getToken.returns( Promise.resolve( { token: 'token' } ) );

			return tasks.downloadTranslations().then( () => {
				sinon.assert.calledOnce( stubs.translations.downloadTranslations );
				sinon.assert.alwaysCalledWithExactly( stubs.translations.downloadTranslations, {
					token: 'token',
				} );
			} );
		} );
	} );

	describe( 'uploadTranslations()', () => {
		it( 'should upload translations for the given package', () => {
			stubs.translations.getToken.returns( Promise.resolve( { token: 'token' } ) );

			return tasks.uploadTranslations( 'packageName' ).then( () => {
				sinon.assert.calledOnce( stubs.translations.uploadTranslations );
				sinon.assert.alwaysCalledWithExactly( stubs.translations.uploadTranslations, {
					token: 'token',
				}, 'packageName' );
			} );
		} );
	} );
} );
