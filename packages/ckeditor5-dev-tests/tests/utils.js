/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const fs = require( 'fs' );

describe( 'Utils', () => {
	let sandbox, utils;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		utils = require( '../lib/utils' );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'getKarmaConfig()', () => {
		it( 'checks the whole "tests" directory when test paths are not specified', () => {
			const karmaConfig = utils.getKarmaConfig( {
				rootPath: __dirname
			} );

			expect( karmaConfig.files ).to.deep.equal( [
				path.join( 'tests', '**', '*.js' )
			] );
		} );

		it( 'transforms specified test paths to the Karma configuration', () => {
			const lstatStub = sandbox.stub( fs, 'lstatSync' );

			// The whole `ckeditor5-basic-styles` package.
			lstatStub.withArgs( path.join( __dirname, 'tests', 'basic-styles' ) ).returns( {
				isDirectory() {
					return true;
				}
			} );

			// A part of the `ckeditor5-engine` package.
			lstatStub.withArgs( path.join( __dirname, 'tests', 'engine/view' ) ).returns( {
				isDirectory() {
					return true;
				}
			} );

			// Single file from `ckeditor5-paragraph` package.
			lstatStub.withArgs( path.join( __dirname, 'tests', 'paragraph/paragraph.js' ) ).returns( {
				isDirectory() {
					return false;
				}
			} );

			const karmaConfig = utils.getKarmaConfig( {
				rootPath: __dirname,
				paths: [
					'basic-styles',
					'engine/view',
					'paragraph/paragraph.js'
				]
			} );

			expect( lstatStub.calledThrice ).to.equal( true );
			expect( karmaConfig.files ).to.deep.equal( [
				path.join( 'tests', 'basic-styles', '**', '*.js' ),
				path.join( 'tests', 'engine', 'view', '**', '*.js' ),
				path.join( 'tests', 'paragraph', 'paragraph.js' ),
			] );
		} );

		it( 'generates the coverage for sources', () => {
			const karmaConfig = utils.getKarmaConfig( {
				rootPath: __dirname,
				coverage: true
			} );

			expect( karmaConfig.reporters ).to.contain( 'coverage' );
		} );

		it( 'runs Karma with the watcher', () => {
			const karmaConfig = utils.getKarmaConfig( {
				rootPath: __dirname,
				watch: true
			} );

			expect( karmaConfig.autoWatch ).to.equal( true );
			expect( karmaConfig.singleRun ).to.equal( false );
		} );
	} );

	describe( 'getWebpackConfig()', () => {
		let defaultExcludes = [
			/(node_modules)/,
			/tests/,
			/theme/,
			/lib/
		];

		it( 'generates the coverage for specified sources', () => {
			const readdirStub = sandbox.stub( fs, 'readdirSync' ).returns( [
				'engine',
				'basic-styles',
				'core',
				'paragraph'
			] );

			const webpackConfig = utils.getWebpackConfig( {
				rootPath: __dirname,
				coverage: true,
				paths: [
					'engine',
					'paragraph'
				]
			} );

			expect( readdirStub.calledOnce ).to.equal( true );
			expect( readdirStub.firstCall.args[ 0 ] ).to.equal( path.join( __dirname, 'ckeditor5' ) );

			const preLoaders = webpackConfig.module.preLoaders;

			expect( preLoaders.length ).to.equal( 2 );
			expect( preLoaders[ 1 ].exclude ).to.deep.equal( [
				/ckeditor5\/basic-styles/,
				/ckeditor5\/core/
			].concat( defaultExcludes ) );
		} );

		it( 'generates the coverage for all files when sources are not specified', () => {
			const readdirStub = sandbox.stub( fs, 'readdirSync' ).returns( [
				'engine',
				'basic-styles',
				'core',
				'paragraph'
			] );

			const webpackConfig = utils.getWebpackConfig( {
				rootPath: __dirname,
				coverage: true
			} );

			expect( readdirStub.calledOnce ).to.equal( false );

			const preLoaders = webpackConfig.module.preLoaders;

			expect( preLoaders.length ).to.equal( 2 );
			expect( preLoaders[ 1 ].exclude ).to.deep.equal( defaultExcludes );
		} );
	} );

	describe( 'getPackageName()', () => {
		it( 'returns package name from current work directory', () => {
			expect( utils.getPackageName() ).to.equal( 'dev-tests' );
		} );

		it( 'returns package name from specify work directory', () => {
			const cwd = path.resolve( __dirname, '_stubs', 'basic-styles' );

			expect( utils.getPackageName( cwd ) ).to.equal( 'basic-styles' );
		} );

		it( 'throws an error when the "package.json" file does not exist', () => {
			const packageJsonPath = path.resolve( __dirname, 'package.json' );

			expect( () => {
				utils.getPackageName( __dirname );
			} ).to.throw( Error, `Cannot find module '${ packageJsonPath }'` );
		} );

		it( 'throws an error when package name cannot be resolved', () => {
			expect( () => {
				const cwd = path.resolve( __dirname, '_stubs', 'invalid' );

				utils.getPackageName( cwd );
			} ).to.throw( Error, 'The package name does not start with a "ckeditor5-".' );
		} );

		it( 'returns temporary implementation of the UI package', () => {
			const cwd = path.resolve( __dirname, '_stubs', 'ui-default' );

			expect( utils.getPackageName( cwd ) ).to.equal( 'ui' );
		} );
	} );

	describe( 'parseArguments()', () => {
		it( 'returns an object with default values', () => {
			const args = utils.parseArguments();

			// Checks the parameters.
			expect( args.paths ).to.equal( null );
			expect( args.browsers ).to.deep.equal( [ 'Chrome' ] );
			expect( args.watch ).to.equal( false );
			expect( args.coverage ).to.equal( false );
			expect( args.sourceMap ).to.equal( false );
			expect( args.verbose ).to.equal( false );
			expect( args.rootPath ).to.equal( path.resolve( './.build/' ) );

			// Check the aliases.
			expect( args.c ).to.equal( args.coverage );
			expect( args.w ).to.equal( args.watch );
			expect( args.s ).to.equal( args.sourceMap );
			expect( args.v ).to.equal( args.verbose );
		} );
	} );
} );
