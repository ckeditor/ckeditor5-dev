/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const path = require( 'path' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const mockery = require( 'mockery' );
const glob = require( 'glob' );
const fs = require( 'fs-extra' );

describe( 'collect-utils', () => {
	let sandbox;
	let utils;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		sandbox.stub( process, 'cwd', () => path.join( 'workspace', 'ckeditor5' ) );
		utils = require( '../../lib/translations/collect-utils' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		sandbox.restore();
	} );

	describe( 'collectTranslations()', () => {
		it( 'should collect info about t() calls', () => {
			const fileContents = {
				'/ckeditor5-core/file1.js': '= t( \'Bold\' );',
				'/ckeditor5-utils/file2.js': '= t( \'Italic [context: italic style]\' );',
			};

			const globSyncStub = sandbox.stub( glob, 'sync', () => [
				path.sep + path.join( 'ckeditor5-core', 'file1.js' ),
				path.sep + path.join( 'ckeditor5-utils', 'file2.js' )
			] );

			const readFileStub = sandbox.stub( fs, 'readFileSync', fileName => fileContents[ fileName ] );

			const translations = utils.collectTranslations();

			sinon.assert.calledWithExactly( globSyncStub,
				path.join( 'workspace', 'ckeditor5', 'packages', '*', 'src', '**', '*.js' )
			);
			sinon.assert.calledTwice( readFileStub );
			sinon.assert.calledWithExactly( readFileStub, path.sep + path.join( 'ckeditor5-core', 'file1.js' ), 'utf-8' );
			sinon.assert.calledWithExactly( readFileStub, path.sep + path.join( 'ckeditor5-utils', 'file2.js' ), 'utf-8' );

			expect( translations ).to.deep.equal( [ {
				filePath: '/ckeditor5-core/file1.js',
				key: 'Bold',
				package: 'ckeditor5-core',
				context: null,
				sentence: 'Bold',
			}, {
				filePath: '/ckeditor5-utils/file2.js',
				key: 'Italic [context: italic style]',
				package: 'ckeditor5-utils',
				context: 'italic style',
				sentence: 'Italic',
			} ] );
		} );
	} );

	describe( 'getContexts()', () => {
		it( 'should collect contexts.json files across ckeditor5/packages/ckeditor5-* packages', () => {
			const path1 = path.join( 'workspace', 'ckeditor5', 'packages', 'ckeditor5-core', 'lang', 'contexts.json' );
			const path2 = path.join( 'workspace', 'ckeditor5', 'packages', 'ckeditor5-utils', 'lang', 'contexts.json' );

			const fileContents = {
				[ path1 ]: '{ "italic style": "Italic style" }',
				[ path2 ]: '{}'
			};

			const readDirStub = sandbox.stub( fs, 'readdirSync', () => ( [ 'ckeditor5-core', 'ckeditor5-utils' ] ) );
			sandbox.stub( fs, 'existsSync', () => true );
			sandbox.stub( fs, 'readFileSync', ( filePath ) => fileContents[ filePath ] );

			const contexts = utils.getContexts();

			sinon.assert.calledWithExactly( readDirStub, path.join( 'workspace', 'ckeditor5', 'packages' ) );

			expect( contexts.constructor.name ).to.equal( 'Map' );
			expect( [ ...contexts ] ).to.deep.equal( [
				[ 'ckeditor5-core', { filePath: path1, content: { 'italic style': 'Italic style' } } ],
				[ 'ckeditor5-utils', { filePath: path2, content: {} } ]
			] );
		} );
	} );

	describe( 'getMissingContextErrorMessages()', () => {
		it( 'should return error when ckeditor5-core is missing', () => {
			const contexts = new Map();
			const translations = [ {
				package: 'ckeditor5-utils',
			} ];
			const errors = utils.getMissingContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [
				'ckeditor5-core/lang/contexts.json file is missing.'
			] );
		} );

		it( 'should return error when lang/contexts.json could be missing', () => {
			const contexts = new Map( [
				[ 'ckeditor5-core', { content: {} } ]
			] );
			const translations = [ {
				package: 'ckeditor5-utils',
				key: 'util'
			} ];
			const errors = utils.getMissingContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [
				`contexts.json file or context for the translation key is missing (ckeditor5-utils, util).`
			] );
		} );

		it( 'shouldn\'t return error when translation exists in ckeditor5-core/lang/contexts.json', () => {
			const contexts = new Map( [
				[ 'ckeditor5-core', { content: { util: 'Util' } } ]
			] );
			const translations = [ {
				package: 'ckeditor5-utils',
				key: 'util'
			} ];
			const errors = utils.getMissingContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [] );
		} );

		it( 'shouldn\'t return error when translation exists in package that is relevant for the translation', () => {
			const contexts = new Map( [
				[ 'ckeditor5-core', { content: {} } ],
				[ 'ckeditor5-utils', { content: { util: 'Util' } } ]
			] );
			const translations = [ {
				package: 'ckeditor5-utils',
				key: 'util'
			} ];
			const errors = utils.getMissingContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [] );
		} );
	} );

	describe( 'getUnusedContextErrorMessages()', () => {
		it( 'should return errors when contexts for the translations were not used', () => {
			const contexts = new Map( [
				[ 'ckeditor5-utils', { content: { util: 'Util' } } ]
			] );
			const translations = [];

			const errors = utils.getUnusedContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [
				'Unused context: ckeditor5-utils/util.'
			] );
		} );

		it( 'should not return errors when all contexts were used', () => {
			const contexts = new Map( [
				[ 'ckeditor5-utils', { content: { util: 'Util' } } ]
			] );
			const translations = [ {
				package: 'ckeditor5-utils',
				key: 'util'
			} ];

			const errors = utils.getUnusedContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [] );
		} );
	} );

	describe( 'getRepeatedContextErrorMessages()', () => {
		it( 'should return an error when the key for translation context is dupliacted', () => {
			const contexts = new Map( [
				[ 'ckeditor5-core', { content: { util: 'Util' } } ],
				[ 'ckeditor5-utils', { content: { util: 'Util' } } ]
			] );

			const errors = utils.getRepeatedContextErrorMessages( contexts );
			expect( errors ).to.deep.equal( [
				'Context is duplicated for the key: util.'
			] );
		} );
	} );

	describe( 'createPotFileContent()', () => {
		it( 'shoud translate json object to po-style text', () => {
			const context = { content: { util: 'Util' } };
			const poContent = utils.createPotFileContent( context );

			expect( poContent ).to.be.equal(
`msgctxt "Util"
msgid "util"
msgstr "util"
`
			);
		} );
	} );

	describe( 'savePotFile()', () => {
		it( 'should write pot file', () => {
			const outputFileStub = sandbox.stub( fs, 'outputFileSync', () => {} );
			utils.savePotFile( 'packageName', 'fileContent' );

			sinon.assert.alwaysCalledWith(
				outputFileStub,
				path.join( 'workspace', 'ckeditor5', 'build', '.transifex', 'packageName', 'en.pot' ),
				'fileContent'
			);
		} );
	} );
} );
