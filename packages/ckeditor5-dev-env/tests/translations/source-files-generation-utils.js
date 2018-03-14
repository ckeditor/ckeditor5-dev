/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const glob = require( 'glob' );
const fs = require( 'fs-extra' );
const proxyquire = require( 'proxyquire' );

describe( 'source-files-generation-utils', () => {
	let sandbox, utils, stubs, originalStringMap;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		stubs = {
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			translations: {
				findOriginalStrings: sandbox.spy( string => originalStringMap[ string ] )
			},
			delSync: sandbox.spy()
		};

		sandbox.stub( process, 'cwd' ).returns( path.join( 'workspace', 'ckeditor5' ) );

		utils = proxyquire( '../../lib/translations/source-files-generation-utils', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger: () => stubs.logger,
				translations: stubs.translations
			},
			del: {
				sync: stubs.delSync
			}
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'collectTranslations()', () => {
		it( 'should collect info about t() calls', () => {
			const fileContents = {
				'/ckeditor5-core/file1.js': 't( \'Bold\' );',
				'/ckeditor5-utils/file2.js': 't( \'Italic [context: italic style]\' );',
			};

			originalStringMap = {
				't( \'Bold\' );': [ 'Bold' ],
				't( \'Italic [context: italic style]\' );': [ 'Italic [context: italic style]' ]
			};

			const globSyncStub = sandbox.stub( glob, 'sync' ).returns( [
				path.sep + path.join( 'ckeditor5-core', 'file1.js' ),
				path.sep + path.join( 'ckeditor5-utils', 'file2.js' )
			] );

			const readFileStub = sandbox.stub( fs, 'readFileSync' ).callsFake( fileName => fileContents[ fileName ] );

			const translations = utils.collectTranslations();

			sinon.assert.calledWithExactly( globSyncStub,
				path.join( 'workspace', 'ckeditor5', 'packages', '*', 'src', '**', '*.js' )
			);
			sinon.assert.calledTwice( readFileStub );
			sinon.assert.calledWithExactly(
				readFileStub, path.sep + path.join( 'ckeditor5-core', 'file1.js' ), 'utf-8'
			);
			sinon.assert.calledWithExactly(
				readFileStub, path.sep + path.join( 'ckeditor5-utils', 'file2.js' ), 'utf-8'
			);

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

			const readDirStub = sandbox.stub( fs, 'readdirSync' ).returns( [ 'ckeditor5-core', 'ckeditor5-utils' ] );
			sandbox.stub( fs, 'existsSync' ).returns( true );
			sandbox.stub( fs, 'readFileSync' ).callsFake( filePath => fileContents[ filePath ] );

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
		it( 'should return an error when ckeditor5-core is missing', () => {
			const contexts = new Map();
			const translations = [ {
				package: 'ckeditor5-utils',
			} ];
			const errors = utils.getMissingContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [
				'ckeditor5-core/lang/contexts.json file is missing.'
			] );
		} );

		it( 'should return an error when lang/contexts.json could be missing', () => {
			const contexts = new Map( [
				[ 'ckeditor5-core', { content: {} } ]
			] );
			const translations = [ {
				package: 'ckeditor5-utils',
				key: 'util'
			} ];
			const errors = utils.getMissingContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [
				'contexts.json file or context for the translation key is missing (ckeditor5-utils, util).'
			] );
		} );

		it( 'should return an error when the translation does not exist', () => {
			const contexts = new Map( [
				[ 'ckeditor5-core', { content: {} } ],
				[ 'ckeditor5-utils', { content: {} } ]
			] );

			const translations = [ {
				package: 'ckeditor5-utils',
				key: 'util'
			} ];

			const errors = utils.getMissingContextErrorMessages( contexts, translations );

			expect( errors ).to.deep.equal( [
				'Context for the translation key is missing (ckeditor5-utils, util).'
			] );
		} );

		it( 'should not return errors when translation exists in ckeditor5-core/lang/contexts.json', () => {
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

		it( 'should not return errors when translation exists in package that is relevant for the translation', () => {
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
		it( 'should return an error when the key for translation context is duplicated', () => {
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

	describe( 'removeExistingPotFiles()', () => {
		it( 'should remove existing po files from the transifex directory', () => {
			utils.removeExistingPotFiles();

			sinon.assert.calledWithExactly(
				stubs.delSync,
				path.join( 'workspace', 'ckeditor5', 'build', '.transifex' )
			);
		} );
	} );

	describe( 'createPotFileContent()', () => {
		it( 'should translate json object to po-style text', () => {
			const context = { content: { util: 'Util' } };
			const poContent = utils.createPotFileContent( context );

			/* eslint-disable indent */
			expect( poContent ).to.be.equal(
`msgctxt "Util"
msgid "util"
msgstr "util"
`
			);
			/* eslint-enable indent */
		} );
	} );

	describe( 'createPotFileHeader', () => {
		it( 'should return a pot file default header', () => {
			const getFullYearStub = sandbox.stub( Date.prototype, 'getFullYear' ).returns( 2100 );

			const header = utils.createPotFileHeader();

			const part1 = '# Copyright (c)';
			const part2 = ' 2003-2100, CKSource - Frederico Knabben. All rights reserved.\n\n';

			expect( header )
				// Use a concatenated string to not have this date updated by the bump-year.js script.
				.to.equal( part1 + part2 );
			sinon.assert.calledOnce( getFullYearStub );
		} );
	} );

	describe( 'savePotFile()', () => {
		it( 'should write pot file', () => {
			const outputFileStub = sandbox.stub( fs, 'outputFileSync' );
			utils.savePotFile( 'packageName', 'fileContent' );

			sinon.assert.alwaysCalledWith(
				outputFileStub,
				path.join( 'workspace', 'ckeditor5', 'build', '.transifex', 'packageName', 'en.pot' ),
				'fileContent'
			);
		} );
	} );
} );
