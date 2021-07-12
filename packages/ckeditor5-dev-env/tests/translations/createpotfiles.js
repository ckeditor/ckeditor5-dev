/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const { posix } = require( 'path' );
const { expect } = require( 'chai' );

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
				translations: stubs.translations
			},
			'path': posix
		} );

		sinon.stub( process, 'cwd' ).returns( 'cwd' );
	} );

	afterEach( () => {
		sinon.restore();
	} );

	it( 'should not create any POT file if no package is passed', () => {
		createPotFiles( {
			sourceFiles: [],
			packagePaths: [],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.notCalled( stubs.fs.outputFileSync );
	} );

	it( 'should delete the build directory before creating POT files', () => {
		createFakeContextFile( 'packages/ckeditor5-foo/lang/contexts.json', { foo_id: 'foo_context' } );
		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [ { string: 'foo', id: 'foo_id' } ] );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledOnce( stubs.del.sync );

		sinon.assert.calledWithExactly(
			stubs.del.sync,
			'cwd/build/.transifex'
		);

		sinon.assert.callOrder(
			stubs.del.sync,
			stubs.fs.outputFileSync
		);
	} );

	it( 'should create a POT file entry for one message with a corresponding context', () => {
		createFakeContextFile( 'packages/ckeditor5-foo/lang/contexts.json', { foo_id: 'foo_context' } );

		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			'cwd/build/.transifex/ckeditor5-foo/en.pot',
			`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource - Frederico Knabben. All rights reserved.

msgctxt "foo_context"
msgid "foo_id"
msgstr "foo"
`
		);
	} );

	it( 'should warn if the message context is missing', () => {
		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledOnce( stubs.logger.error );
		sinon.assert.calledWithExactly(
			stubs.logger.error,
			'Context for the message id is missing (\'foo_id\' from packages/ckeditor5-foo/src/foo.js).'
		);

		sinon.assert.notCalled( stubs.fs.outputFileSync );

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).to.equal( 1 );
	} );

	it( 'should create a POT file entry for every defined package', () => {
		createFakeContextFile( 'packages/ckeditor5-foo/lang/contexts.json', { foo_id: 'foo_context' } );
		createFakeContextFile( 'packages/ckeditor5-bar/lang/contexts.json', { bar_id: 'bar_context' } );

		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

		createFakeSourceFileWithMessages( 'packages/ckeditor5-bar/src/bar.js', [
			{ string: 'bar', id: 'bar_id' }
		] );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js', 'packages/ckeditor5-bar/src/bar.js' ],
			packagePaths: [ 'packages/ckeditor5-foo', 'packages/ckeditor5-bar' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledTwice( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			'cwd/build/.transifex/ckeditor5-foo/en.pot',
			`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource - Frederico Knabben. All rights reserved.

msgctxt "foo_context"
msgid "foo_id"
msgstr "foo"
` );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			'cwd/build/.transifex/ckeditor5-bar/en.pot',
			`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource - Frederico Knabben. All rights reserved.

msgctxt "bar_context"
msgid "bar_id"
msgstr "bar"
`
		);
	} );

	it( 'should create one POT file entry from multiple files in the same package', () => {
		createFakeContextFile( 'packages/ckeditor5-foo/lang/contexts.json', {
			foo_id: 'foo_context',
			bar_id: 'bar_context'
		} );

		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/bar.js', [
			{ string: 'bar', id: 'bar_id' }
		] );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js', 'packages/ckeditor5-foo/src/bar.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			'cwd/build/.transifex/ckeditor5-foo/en.pot',
			`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource - Frederico Knabben. All rights reserved.

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
		createFakeContextFile( 'packages/ckeditor5-foo/lang/contexts.json', {
			foo_id: 'foo_context'
		} );

		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id', plural: 'foo_plural' }
		] );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			'cwd/build/.transifex/ckeditor5-foo/en.pot',
			`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource - Frederico Knabben. All rights reserved.

msgctxt "foo_context"
msgid "foo_id"
msgid_plural "foo_plural"
msgstr[0] "foo"
msgstr[1] "foo_plural"
`
		);
	} );

	it( 'should load the core context file once and use its contexts', () => {
		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

		createFakeContextFile( 'packages/ckeditor5-core/lang/contexts.json', {
			foo_id: 'foo_context'
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo', 'packages/ckeditor5-core' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.notCalled( stubs.logger.error );

		sinon.assert.calledOnce( stubs.fs.outputFileSync );

		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			'cwd/build/.transifex/ckeditor5-core/en.pot',
			`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource - Frederico Knabben. All rights reserved.

msgctxt "foo_context"
msgid "foo_id"
msgstr "foo"
`
		);
	} );

	it( 'should not create a POT file for the context file if that was not added to the list of packages', () => {
		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

		createFakeContextFile( 'packages/ckeditor5-core/lang/contexts.json', {
			foo_id: 'foo_context'
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.notCalled( stubs.logger.error );
		sinon.assert.notCalled( stubs.fs.outputFileSync );
	} );

	it( 'should log an error if the file contains a message that cannot be parsed', () => {
		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [], [ 'parse_error' ] );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledOnce( stubs.logger.error );

		sinon.assert.calledWithExactly(
			stubs.logger.error,
			'parse_error'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).to.equal( 1 );
	} );

	it( 'should log an error if two context files contain contexts the same id', () => {
		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

		createFakeContextFile( 'packages/ckeditor5-foo/lang/contexts.json', { foo_id: 'foo_context1' } );
		createFakeContextFile( 'packages/ckeditor5-core/lang/contexts.json', { foo_id: 'foo_context2' } );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledOnce( stubs.logger.error );

		sinon.assert.calledWithExactly(
			stubs.logger.error,
			'Context is duplicated for the id: \'foo_id\' in ' +
			'packages/ckeditor5-core/lang/contexts.json and packages/ckeditor5-foo/lang/contexts.json.'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).to.equal( 1 );
	} );

	it( 'should log an error if a context is unused', () => {
		createFakeSourceFileWithMessages( 'packages/ckeditor5-foo/src/foo.js', [
			{ string: 'foo', id: 'foo_id' }
		] );

		createFakeContextFile( 'packages/ckeditor5-foo/lang/contexts.json', {
			foo_id: 'foo_context',
			bar_id: 'foo_context'
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			logger: stubs.logger
		} );

		sinon.assert.calledOnce( stubs.logger.error );

		sinon.assert.calledWithExactly(
			stubs.logger.error,
			'Unused context: \'bar_id\' in ckeditor5-foo/lang/contexts.json'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).to.equal( 1 );
	} );

	function createFakeSourceFileWithMessages( file, messages, errors = [] ) {
		const content = file + '_content';

		stubs.fs.readFileSync
			.withArgs( file ).returns( content );

		stubs.translations.findMessages
			.withArgs( content ).callsFake( ( fileContent, filePath, onFoundMessage, onErrorFound ) => {
				messages.forEach( message => onFoundMessage( message ) );
				errors.forEach( error => onErrorFound( error ) );
			} );
	}

	function createFakeContextFile( pathToContext, content ) {
		stubs.fs.readFileSync
			.withArgs( pathToContext ).returns( JSON.stringify( content ) );

		stubs.fs.existsSync
			.withArgs( pathToContext ).returns( true );
	}
} );
