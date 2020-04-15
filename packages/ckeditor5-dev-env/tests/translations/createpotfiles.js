/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const path = require( 'path' );

describe( 'createPotFiles', () => {
	let stubs;
	let createPotFiles;

	beforeEach( () => {
		stubs = {
			logger: {
				info: sinon.stub(),
				warning: sinon.stub(),
				error: sinon.stub()
			},

			translations: {
				findMessages: sinon.stub()
			},

			del: {
				sync: sinon.stub()
			},

			fs: {
				readFileSync: sinon.stub(),
				outputFileSync: sinon.stub(),
				existsSync: sinon.stub()
			}
		};

		createPotFiles = proxyquire( '../../lib/translations/createpotfiles', {
			'del': stubs.del,
			'fs-extra': stubs.fs,
			'@ckeditor/ckeditor5-dev-utils': {
				logger: () => stubs.logger,
				translations: stubs.translations
			}
		} );
	} );

	afterEach( () => {
		sinon.restore();
	} );

	it( 'should create an empty POT file when no message is found', () => {
		stubs.fs.readFileSync
			.withArgs( 'ckeditor5-foo/src/foo.js' ).returns( 'foo_js_content' );

		stubs.translations.findMessages
			.withArgs( 'foo_js_content' ).callsFake( () => { } );

		sinon.stub( process, 'cwd' ).returns( 'cwd' );

		createPotFiles( {
			sourceFiles: [ 'ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'ckeditor5-foo' ],
			corePackagePath: 'ckeditor5-core'
		} );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'cwd', 'build', '.transifex', 'ckeditor5-foo', 'en.pot' ),
			'# Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.\n\n'
		);
	} );

	it( 'should create a POT file entry for one message with a corresponding context', () => {
		stubs.fs.readFileSync
			.withArgs( path.join( 'ckeditor5-foo', 'lang', 'contexts.json' ) ).returns( '{"foo_id": "Foo"}' )
			.withArgs( 'ckeditor5-foo/src/foo.js' ).returns( 'foo_js_content' );

		stubs.fs.existsSync
			.withArgs( path.join( 'ckeditor5-foo', 'lang', 'contexts.json' ) ).returns( true );

		stubs.translations.findMessages
			.withArgs( 'foo_js_content' ).callsFake( ( fileContent, filePath, onFoundMessage ) => {
				onFoundMessage( { string: 'foo', id: 'foo_id' } );
			} );

		sinon.stub( process, 'cwd' ).returns( 'cwd' );

		createPotFiles( {
			sourceFiles: [ 'ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'ckeditor5-foo' ],
			corePackagePath: 'ckeditor5-core'
		} );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'cwd', 'build', '.transifex', 'ckeditor5-foo', 'en.pot' ),
			`# Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.

msgctxt "Foo"
msgid "foo_id"
msgstr "foo"
`
		);
	} );

	it( 'should create a POT file entry for one message with a defined context', () => {
		stubs.fs.readFileSync
			.withArgs( 'ckeditor5-foo/src/foo.js' ).returns( 'foo_js_content' );

		stubs.translations.findMessages
			.withArgs( 'foo_js_content' ).callsFake( ( fileContent, filePath, onFoundMessage ) => {
				onFoundMessage( { string: 'foo', id: 'foo_id', context: 'Foo' } );
			} );

		sinon.stub( process, 'cwd' ).returns( 'cwd' );

		createPotFiles( {
			sourceFiles: [ 'ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'ckeditor5-foo' ],
			corePackagePath: 'ckeditor5-core'
		} );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'cwd', 'build', '.transifex', 'ckeditor5-foo', 'en.pot' ),
			`# Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.

msgctxt "Foo"
msgid "foo_id"
msgstr "foo"
`
		);
	} );

	it( 'should create a POT file entry for one message that has no defined context', () => {
		stubs.fs.readFileSync
			.withArgs( 'ckeditor5-foo/src/foo.js' ).returns( 'foo_js_content' );

		stubs.translations.findMessages
			.withArgs( 'foo_js_content' ).callsFake( ( fileContent, filePath, onFoundMessage ) => {
				onFoundMessage( { string: 'foo', id: 'foo_id' } );
			} );

		sinon.stub( process, 'cwd' ).returns( 'cwd' );

		createPotFiles( {
			sourceFiles: [ 'ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'ckeditor5-foo' ],
			corePackagePath: 'ckeditor5-core'
		} );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'cwd', 'build', '.transifex', 'ckeditor5-foo', 'en.pot' ),
			`# Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.

msgid "foo_id"
msgstr "foo"
`
		);
	} );

	it( 'should create a POT file entry for every defined package', () => {
		stubs.fs.readFileSync
			.withArgs( 'ckeditor5-foo/src/foo.js' ).returns( 'foo_js_content' )
			.withArgs( 'ckeditor5-bar/src/bar.js' ).returns( 'bar_js_content' );

		stubs.translations.findMessages
			.withArgs( 'foo_js_content' ).callsFake( ( fileContent, filePath, onFoundMessage ) => {
				onFoundMessage( { string: 'foo', id: 'foo_id' } );
			} )
			.withArgs( 'bar_js_content' ).callsFake( ( fileContent, filePath, onFoundMessage ) => {
				onFoundMessage( { string: 'bar', id: 'bar_id' } );
			} );

		sinon.stub( process, 'cwd' ).returns( 'cwd' );

		createPotFiles( {
			sourceFiles: [ 'ckeditor5-foo/src/foo.js', 'ckeditor5-bar/src/bar.js' ],
			packagePaths: [ 'ckeditor5-foo', 'ckeditor5-bar' ],
			corePackagePath: 'ckeditor5-core'
		} );

		sinon.assert.calledTwice( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'cwd', 'build', '.transifex', 'ckeditor5-foo', 'en.pot' ),
			`# Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.

msgid "foo_id"
msgstr "foo"
` );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'cwd', 'build', '.transifex', 'ckeditor5-bar', 'en.pot' ),
			`# Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.

msgid "bar_id"
msgstr "bar"
`
		);
	} );

	it( 'should create one POT file entry from multiple files in the same package', () => {
		stubs.fs.readFileSync
			.withArgs( 'ckeditor5-foo/src/foo.js' ).returns( 'foo_js_content' )
			.withArgs( 'ckeditor5-foo/src/bar.js' ).returns( 'bar_js_content' );

		stubs.translations.findMessages
			.withArgs( 'foo_js_content' ).callsFake( ( fileContent, filePath, onFoundMessage ) => {
				onFoundMessage( { string: 'foo', id: 'foo_id' } );
			} )
			.withArgs( 'bar_js_content' ).callsFake( ( fileContent, filePath, onFoundMessage ) => {
				onFoundMessage( { string: 'bar', id: 'bar_id' } );
			} );

		sinon.stub( process, 'cwd' ).returns( 'cwd' );

		createPotFiles( {
			sourceFiles: [ 'ckeditor5-foo/src/foo.js', 'ckeditor5-foo/src/bar.js' ],
			packagePaths: [ 'ckeditor5-foo' ],
			corePackagePath: 'ckeditor5-core'
		} );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'cwd', 'build', '.transifex', 'ckeditor5-foo', 'en.pot' ),
			`# Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.

msgid "foo_id"
msgstr "foo"

msgid "bar_id"
msgstr "bar"
`
		);
	} );
} );

// 	it( 'should collect translations', () => {
// 		stubs.collectUtils.getContexts.returns( new Map( [
// 			[
// 				'ckeditor5-ui',
// 				{
// 					filePath: 'path/to/file',
// 					content: {}
// 				}
// 			]
// 		] ) );

// 		stubs.collectUtils.createPotFileHeader.returns( 'header' );
// 		stubs.collectUtils.createPotFileContent.returns( 'content' );

// 		collect();

// 		sinon.assert.calledOnce( stubs.collectUtils.savePotFile );
// 		sinon.assert.calledWithExactly( stubs.collectUtils.savePotFile, 'ckeditor5-ui', 'headercontent' );
// 	} );

// 	it( 'should log the error and return it when hits one', () => {
// 		stubs.collectUtils.getContexts.returns( new Map() );
// 		stubs.collectUtils.getMissingContextErrorMessages.returns( [
// 			'ckeditor5-core/lang/context.json file is missing'
// 		] );
// 		stubs.collectUtils.createPotFileHeader.returns( 'header' );
// 		stubs.collectUtils.createPotFileContent.returns( 'content' );

// 		collect();

// 		sinon.assert.notCalled( stubs.collectUtils.savePotFile );
// 		sinon.assert.calledWithExactly( stubs.logger.error, 'ckeditor5-core/lang/context.json file is missing' );
// 	} );

// 	it( 'should remove existing po files', () => {
// 		stubs.collectUtils.getContexts.returns( new Map() );

// 		collect();

// 		sinon.assert.calledOnce( stubs.collectUtils.removeExistingPotFiles );
// 	} );

// 	describe( 'collectTranslations()', () => {
// 		it( 'should collect info about t() calls', () => {
// 			const fileContents = {
// 				'/ckeditor5-core/file1.js': 't( \'Bold\' );',
// 				'/ckeditor5-utils/file2.js': 't( \'Italic [context: italic style]\' );'
// 			};

// 			// textsToMessages = {
// 			// 	't( \'Bold\' );': [ 'Bold' ],
// 			// 	't( \'Italic [context: italic style]\' );': [ 'Italic [context: italic style]' ]
// 			// };

// 			const globSyncStub = sandbox.stub( glob, 'sync' ).returns( [
// 				path.sep + path.join( 'ckeditor5-core', 'file1.js' ),
// 				path.sep + path.join( 'ckeditor5-utils', 'file2.js' )
// 			] );

// 			const readFileStub = sandbox.stub( fs, 'readFileSync' ).callsFake( fileName => fileContents[ fileName ] );

// 			const translations = utils.collectTranslations();

// 			sinon.assert.calledWithExactly( globSyncStub,
// 				path.join( 'workspace', 'ckeditor5', 'packages', '*', 'src', '**', '*.js' )
// 			);
// 			sinon.assert.calledTwice( readFileStub );
// 			sinon.assert.calledWithExactly(
// 				readFileStub, path.sep + path.join( 'ckeditor5-core', 'file1.js' ), 'utf-8'
// 			);
// 			sinon.assert.calledWithExactly(
// 				readFileStub, path.sep + path.join( 'ckeditor5-utils', 'file2.js' ), 'utf-8'
// 			);

// 			expect( translations ).to.deep.equal( [ {
// 				filePath: '/ckeditor5-core/file1.js',
// 				key: 'Bold',
// 				package: 'ckeditor5-core',
// 				context: null,
// 				sentence: 'Bold'
// 			}, {
// 				filePath: '/ckeditor5-utils/file2.js',
// 				key: 'Italic [context: italic style]',
// 				package: 'ckeditor5-utils',
// 				context: 'italic style',
// 				sentence: 'Italic'
// 			} ] );
// 		} );
// 	} );

// 	describe( 'getContexts()', () => {
// 		it( 'should collect contexts.json files across ckeditor5/packages/ckeditor5-* packages', () => {
// 			const path1 = path.join( 'workspace', 'ckeditor5', 'packages', 'ckeditor5-core', 'lang', 'contexts.json' );
// 			const path2 = path.join( 'workspace', 'ckeditor5', 'packages', 'ckeditor5-utils', 'lang', 'contexts.json' );

// 			const fileContents = {
// 				[ path1 ]: '{ "italic style": "Italic style" }',
// 				[ path2 ]: '{}'
// 			};

// 			const readDirStub = sandbox.stub( fs, 'readdirSync' ).returns( [ 'ckeditor5-core', 'ckeditor5-utils' ] );
// 			sandbox.stub( fs, 'existsSync' ).returns( true );
// 			sandbox.stub( fs, 'readFileSync' ).callsFake( filePath => fileContents[ filePath ] );

// 			const contexts = utils.getContexts();

// 			sinon.assert.calledWithExactly( readDirStub, path.join( 'workspace', 'ckeditor5', 'packages' ) );

// 			expect( contexts.constructor.name ).to.equal( 'Map' );
// 			expect( [ ...contexts ] ).to.deep.equal( [
// 				[ 'ckeditor5-core', { filePath: path1, content: { 'italic style': 'Italic style' } } ],
// 				[ 'ckeditor5-utils', { filePath: path2, content: {} } ]
// 			] );
// 		} );
// 	} );

// 	describe( 'getMissingContextErrorMessages()', () => {
// 		it( 'should return an error when ckeditor5-core is missing', () => {
// 			const contexts = new Map();
// 			const translations = [ {
// 				package: 'ckeditor5-utils'
// 			} ];
// 			const errors = utils.getMissingContextErrorMessages( contexts, translations );

// 			expect( errors ).to.deep.equal( [
// 				'ckeditor5-core/lang/contexts.json file is missing.'
// 			] );
// 		} );

// 		it( 'should return an error when the translation does not exist', () => {
// 			const contexts = new Map( [
// 				[ 'ckeditor5-core', { content: {} } ],
// 				[ 'ckeditor5-utils', { content: {} } ]
// 			] );

// 			const translations = [ {
// 				package: 'ckeditor5-utils',
// 				key: 'util'
// 			} ];

// 			const errors = utils.getMissingContextErrorMessages( contexts, translations );

// 			expect( errors ).to.deep.equal( [
// 				'Context for the translation key is missing (ckeditor5-utils, util).'
// 			] );
// 		} );

// 		it( 'should not return errors when translation exists in ckeditor5-core/lang/contexts.json', () => {
// 			const contexts = new Map( [
// 				[ 'ckeditor5-core', { content: { util: 'Util' } } ]
// 			] );
// 			const translations = [ {
// 				package: 'ckeditor5-utils',
// 				key: 'util'
// 			} ];
// 			const errors = utils.getMissingContextErrorMessages( contexts, translations );

// 			expect( errors ).to.deep.equal( [] );
// 		} );

// 		it( 'should not return errors when translation exists in package that is relevant for the translation', () => {
// 			const contexts = new Map( [
// 				[ 'ckeditor5-core', { content: {} } ],
// 				[ 'ckeditor5-utils', { content: { util: 'Util' } } ]
// 			] );
// 			const translations = [ {
// 				package: 'ckeditor5-utils',
// 				key: 'util'
// 			} ];
// 			const errors = utils.getMissingContextErrorMessages( contexts, translations );

// 			expect( errors ).to.deep.equal( [] );
// 		} );

// 		it( 'should not return errors when translation exists in other package', () => {
// 			const contexts = new Map( [
// 				[ 'ckeditor5-core', { content: {} } ],
// 				[ 'ckeditor5-heading', { content: {} } ],
// 				[ 'ckeditor5-paragraph', { content: { paragraph: 'Paragraph' } } ]
// 			] );
// 			const translations = [ {
// 				package: 'ckeditor5-heading',
// 				key: 'paragraph'
// 			} ];
// 			const errors = utils.getMissingContextErrorMessages( contexts, translations );

// 			expect( errors ).to.deep.equal( [] );
// 		} );
// 	} );

// 	describe( 'getUnusedContextErrorMessages()', () => {
// 		it( 'should return errors when contexts for the translations were not used', () => {
// 			const contexts = new Map( [
// 				[ 'ckeditor5-utils', { content: { util: 'Util' } } ]
// 			] );
// 			const translations = [];

// 			const errors = utils.getUnusedContextErrorMessages( contexts, translations );

// 			expect( errors ).to.deep.equal( [
// 				'Unused context: ckeditor5-utils/util.'
// 			] );
// 		} );

// 		it( 'should not return errors when all contexts were used', () => {
// 			const contexts = new Map( [
// 				[ 'ckeditor5-utils', { content: { util: 'Util' } } ]
// 			] );
// 			const translations = [ {
// 				package: 'ckeditor5-utils',
// 				key: 'util'
// 			} ];

// 			const errors = utils.getUnusedContextErrorMessages( contexts, translations );

// 			expect( errors ).to.deep.equal( [] );
// 		} );
// 	} );

// 	describe( 'getRepeatedContextErrorMessages()', () => {
// 		it( 'should return an error when the key for translation context is duplicated', () => {
// 			const contexts = new Map( [
// 				[ 'ckeditor5-core', { content: { util: 'Util' } } ],
// 				[ 'ckeditor5-utils', { content: { util: 'Util' } } ]
// 			] );

// 			const errors = utils.getRepeatedContextErrorMessages( contexts );
// 			expect( errors ).to.deep.equal( [
// 				'Context is duplicated for the key: util.'
// 			] );
// 		} );
// 	} );

// 	describe( 'removeExistingPotFiles()', () => {
// 		it( 'should remove existing po files from the transifex directory', () => {
// 			utils.removeExistingPotFiles();

// 			sinon.assert.calledWithExactly(
// 				stubs.delSync,
// 				path.join( 'workspace', 'ckeditor5', 'build', '.transifex' )
// 			);
// 		} );
// 	} );

// 	describe( 'createPotFileContent()', () => {
// 		it( 'should translate json object to po-style text', () => {
// 			const context = { content: { util: 'Util' } };
// 			const poContent = utils.createPotFileContent( context );

// 			/* eslint-disable indent */
// 			expect( poContent ).to.be.equal(
// 				`msgctxt "Util"
// msgid "util"
// msgstr "util"
// `
// 			);
// 			/* eslint-enable indent */
// 		} );

// 		it( 'should support the `"` character', () => {
// 			const context = { content: { '"foo"': '"bar"' } };
// 			const poContent = utils.createPotFileContent( context );

// 			/* eslint-disable indent */
// 			expect( poContent ).to.be.equal(
// 				`msgctxt "\\"bar\\""
// msgid "\\"foo\\""
// msgstr "\\"foo\\""
// `
// 			);
// 			/* eslint-enable indent */
// 		} );
// 	} );

// 	describe( 'createPotFileHeader', () => {
// 		it( 'should return a pot file default header', () => {
// 			const getFullYearStub = sandbox.stub( Date.prototype, 'getFullYear' ).returns( 2100 );

// 			const header = utils.createPotFileHeader();

// 			const part1 = '# Copyright (c)';
// 			const part2 = ' 2003-2100, CKSource - Frederico Knabben. All rights reserved.\n\n';

// 			expect( header )
// 				// Use a concatenated string to not have this date updated by the bump-year.js script.
// 				.to.equal( part1 + part2 );
// 			sinon.assert.calledOnce( getFullYearStub );
// 		} );
// 	} );

// 	describe( 'savePotFile()', () => {
// 		it( 'should write pot file', () => {
// 			const outputFileStub = sandbox.stub( fs, 'outputFileSync' );
// 			utils.savePotFile( 'packageName', 'fileContent' );

// 			sinon.assert.alwaysCalledWith(
// 				outputFileStub,
// 				path.join( 'workspace', 'ckeditor5', 'build', '.transifex', 'packageName', 'en.pot' ),
// 				'fileContent'
// 			);
// 		} );
// 	} );
// } );
