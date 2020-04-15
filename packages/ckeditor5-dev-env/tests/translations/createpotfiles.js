/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const path = require( 'path' );

describe( 'createPotFiles()', () => {
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

		sinon.stub( process, 'cwd' ).returns( 'cwd' );
	} );

	afterEach( () => {
		sinon.restore();
	} );

	it( 'should create an empty POT file when no message is found', () => {
		createFakeSourceFileWithMessages( 'ckeditor5-foo/src/foo.js', [] );

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
		createFakeContext( path.join( 'ckeditor5-foo', 'lang', 'contexts.json' ), { foo_id: 'Foo' } );

		createFakeSourceFileWithMessages( 'ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

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
		createFakeSourceFileWithMessages( 'ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id', context: 'foo_context' }
		] );

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

msgctxt "foo_context"
msgid "foo_id"
msgstr "foo"
`
		);
	} );

	// TODO
	it.skip( 'should warn if no context is defined', () => {
		createFakeSourceFileWithMessages( 'ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

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
		createFakeSourceFileWithMessages( 'ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id', context: 'foo_context' }
		] );

		createFakeSourceFileWithMessages( 'ckeditor5-bar/src/bar.js', [
			{ string: 'bar', id: 'bar_id', context: 'bar_context' }
		] );

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

msgctxt "foo_context"
msgid "foo_id"
msgstr "foo"
` );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'cwd', 'build', '.transifex', 'ckeditor5-bar', 'en.pot' ),
			`# Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.

msgctxt "bar_context"
msgid "bar_id"
msgstr "bar"
`
		);
	} );

	it( 'should create one POT file entry from multiple files in the same package', () => {
		createFakeSourceFileWithMessages( 'ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id', context: 'foo_context' }
		] );

		createFakeSourceFileWithMessages( 'ckeditor5-foo/src/bar.js', [
			{ string: 'bar', id: 'bar_id', context: 'bar_context' }
		] );

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

msgctxt "foo_context"
msgid "foo_id"
msgstr "foo"

msgctxt "bar_context"
msgid "bar_id"
msgstr "bar"
`
		);
	} );

	it( 'should create a POT entry filled with plural forms for message that contains has defined plural forms', () => {
		createFakeSourceFileWithMessages( 'ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id', context: 'foo_context', plural: 'foo_plural' }
		] );

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

msgctxt "foo_context"
msgid "foo_id"
msgid_plural "foo_plural"
msgstr[0] "foo"
msgstr[1] "foo_plural"
`
		);
	} );

	function createFakeSourceFileWithMessages( file, messages ) {
		const content = file + '_content';

		stubs.fs.readFileSync
			.withArgs( file ).returns( content );

		stubs.translations.findMessages
			.withArgs( content ).callsFake( ( fileContent, filePath, onFoundMessage ) => {
				messages.forEach( message => onFoundMessage( message ) );
			} );
	}

	function createFakeContext( pathToContext, content ) {
		stubs.fs.readFileSync
			.withArgs( pathToContext ).returns( JSON.stringify( content ) );

		stubs.fs.existsSync
			.withArgs( pathToContext ).returns( true );
	}
} );
