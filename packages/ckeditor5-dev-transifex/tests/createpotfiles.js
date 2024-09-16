/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import createPotFiles from '../lib/createpotfiles.js';

const {
	pathJoinMock,
	fsExistsSyncMock,
	fsOutputFileSyncMock,
	fsReadFileSyncMock,
	delSyncMock,
	findMessagesMock,
	utilsVerifyPropertiesMock
} = vi.hoisted( () => {
	return {
		pathJoinMock: vi.fn(),
		fsExistsSyncMock: vi.fn(),
		fsOutputFileSyncMock: vi.fn(),
		fsReadFileSyncMock: vi.fn(),
		delSyncMock: vi.fn(),
		findMessagesMock: vi.fn(),
		utilsVerifyPropertiesMock: vi.fn()
	};
} );

vi.mock( 'path', () => {
	return {
		default: {
			join: pathJoinMock
		}
	};
} );

vi.mock( 'fs-extra', () => {
	return {
		default: {
			existsSync: fsExistsSyncMock,
			outputFileSync: fsOutputFileSyncMock,
			readFileSync: fsReadFileSyncMock
		}
	};
} );

vi.mock( 'del', () => {
	return {
		default: {
			sync: delSyncMock
		}
	};
} );

vi.mock( '@ckeditor/ckeditor5-dev-translations', () => {
	return {
		findMessages: findMessagesMock
	};
} );

vi.mock( '../lib/utils.js', () => {
	return {
		verifyProperties: utilsVerifyPropertiesMock
	};
} );

describe( 'dev-transifex/createPotFiles()', () => {
	let loggerMocks;

	beforeEach( () => {
		loggerMocks = {
			info: vi.fn(),
			warning: vi.fn(),
			error: vi.fn()
		};

		vi.mocked( pathJoinMock ).mockImplementation( ( ...args ) => args.join( '/' ) );
	} );

	it( 'should not create any POT file if no package is passed', () => {
		createPotFiles( {
			sourceFiles: [],
			packagePaths: [],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should delete the build directory before creating POT files', () => {
		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( delSyncMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( delSyncMock ) ).toHaveBeenCalledWith( '/cwd/build/.transifex' );
	} );

	it( 'should create a POT file entry for one message with a corresponding context', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				''
			].join( '\n' )
		);
	} );

	it( 'should warn if the message context is missing', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith(
			'Context for the message id is missing (\'foo_id\' from packages/ckeditor5-foo/src/foo.js).'
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 0 );

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).toEqual( 1 );
	} );

	it( 'should create a POT file entry for every defined package', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'bar_id': 'bar_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-bar/src/bar.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'bar', id: 'bar_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js', 'packages/ckeditor5-bar/src/bar.js' ],
			packagePaths: [ 'packages/ckeditor5-foo', 'packages/ckeditor5-bar' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-bar/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 4 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-bar/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			4, 'packages/ckeditor5-bar/src/bar.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenNthCalledWith(
			1,
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenNthCalledWith(
			2,
			'packages/ckeditor5-bar/src/bar.js_content',
			'packages/ckeditor5-bar/src/bar.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenNthCalledWith(
			1,
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				''
			].join( '\n' )
		);
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenNthCalledWith(
			2,
			'/cwd/build/.transifex/ckeditor5-bar/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "bar_context"',
				'msgid "bar_id"',
				'msgstr "bar"',
				''
			].join( '\n' )
		);
	} );

	it( 'should create one POT file entry from multiple files in the same package', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context', 'bar_id': 'bar_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/bar.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'bar', id: 'bar_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js', 'packages/ckeditor5-foo/src/bar.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-foo/src/bar.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenNthCalledWith(
			1,
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenNthCalledWith(
			2,
			'packages/ckeditor5-foo/src/bar.js_content',
			'packages/ckeditor5-foo/src/bar.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				'',
				'msgctxt "bar_context"',
				'msgid "bar_id"',
				'msgstr "bar"',
				''
			].join( '\n' )
		);
	} );

	it( 'should create a POT entry filled with plural forms for message that contains has defined plural forms', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id', plural: 'foo_plural' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgid_plural "foo_plural"',
				'msgstr[0] "foo"',
				'msgstr[1] "foo_plural"',
				''
			].join( '\n' )
		);
	} );

	it( 'should load the core context file once and use its contexts', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo', 'packages/ckeditor5-core' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-core/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 0 );

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-core/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				''
			].join( '\n' )
		);
	} );

	it( 'should not create a POT file for the context file if that was not added to the list of packages', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-core/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 0 );
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should log an error if the file contains a message that cannot be parsed', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage, onErrorFound ) => {
			const errors = [
				'parse_error'
			];

			errors.forEach( error => onErrorFound( error ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith( 'parse_error' );

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).toEqual( 1 );
	} );

	it( 'should log an error if two context files contain contexts the same id', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context1' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context2' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith(
			'Context is duplicated for the id: \'foo_id\' in ' +
			'packages/ckeditor5-core/lang/contexts.json and packages/ckeditor5-foo/lang/contexts.json.'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).toEqual( 1 );
	} );

	it( 'should log an error if a context is unused', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context', 'bar_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith(
			'Unused context: \'bar_id\' in ckeditor5-foo/lang/contexts.json'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).to.equal( 1 );
	} );

	it( 'should fail with an error describing missing properties if the required were not passed to the function', () => {
		vi.mocked( utilsVerifyPropertiesMock ).mockImplementationOnce( ( options, requiredProperties ) => {
			throw new Error( `The specified object misses the following properties: ${ requiredProperties.join( ', ' ) }.` );
		} );

		try {
			createPotFiles( {} );

			throw new Error( 'Expected to throw.' );
		} catch ( err ) {
			expect( err.message ).toEqual(
				'The specified object misses the following properties: sourceFiles, packagePaths, corePackagePath, translationsDirectory.'
			);
		}
	} );

	it( 'should not log an error if a context from the core package is unused when ignoreUnusedCorePackageContexts=true', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context', 'bar_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'custom_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks,
			ignoreUnusedCorePackageContexts: true
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith(
			'Unused context: \'bar_id\' in ckeditor5-foo/lang/contexts.json'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).toEqual( 1 );
	} );

	it( 'should not add the license header in the created a POT file entry when skipLicenseHeader=true', () => {
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( true );
		vi.mocked( fsExistsSyncMock ).mockReturnValueOnce( false );

		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fsReadFileSyncMock ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessagesMock ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks,
			skipLicenseHeader: true
		} );

		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fsExistsSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fsReadFileSyncMock ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessagesMock ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fsOutputFileSyncMock ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				''
			].join( '\n' )
		);
	} );
} );
