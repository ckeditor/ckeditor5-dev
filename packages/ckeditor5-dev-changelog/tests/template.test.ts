/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'upath';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as template from '../src/template.js';
import { CHANGESET_DIRECTORY, TEMPLATE_FILE } from '../src/constants.js';

const EXPECTED_FILE_NAME = '20250526105803_ck_1234567890_git_branch_name.md';

const mocks = vi.hoisted( () => ( {
	log: vi.fn().mockReturnValue( undefined ),
	error: vi.fn().mockReturnValue( undefined ),
	mkdir: vi.fn().mockResolvedValue( undefined ),
	copyFile: vi.fn().mockResolvedValue( undefined ),
	promisify: vi.fn( () => vi.fn().mockResolvedValue( { stdout: '\nck/1234567890-git-branch-name\n', stderr: '' } ) ),
	time: new Date(
		2025, // Year
		4, // Month (0-based, so 4 is May)
		26, // Day
		10, // Hours
		58, // Minutes
		3 // Seconds
	)
} ) );

vi.mock( 'fs/promises', async () => {
	const fs = await vi.importActual( 'fs/promises' );

	return {
		mkdir: mocks.mkdir,
		copyFile: mocks.copyFile,
		constants: fs.constants
	};
} );

vi.mock( 'util', async () => {
	const util = await vi.importActual( 'util' );

	return {
		...util,
		promisify: mocks.promisify
	};
} );

/**
 * Mocks arguments passed via the CLI.
 */
function mockCliArgs( ...args: Array<string> ) {
	vi.stubGlobal( 'process', {
		...process,
		argv: [ 'node', 'cli-command-name', ...args ]
	} );
}

/**
 * Mocks `setTimeout` to immediately execute the callback function.
 */
function mockSetTimeout() {
	vi.spyOn( globalThis, 'setTimeout' ).mockImplementation( ( fn: () => any ) => fn() );
}

describe( 'generateTemplate', () => {
	beforeEach( () => {
		vi.setSystemTime( mocks.time );
		vi.stubGlobal( 'console', {
			warn: console.warn,
			log: mocks.log,
			error: mocks.error
		} );
	} );

	afterEach( () => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	} );

	it( 'creates a directory if necessary', async () => {
		await template.generateTemplate();

		expect( mocks.mkdir ).toHaveBeenCalledWith( join( process.cwd(), CHANGESET_DIRECTORY ), { recursive: true } );
	} );

	it( 'creates a directory if necessary respecting custom `directory` option', async () => {
		await template.generateTemplate( {
			directory: 'custom_directory'
		} );

		expect( mocks.mkdir ).toHaveBeenCalledWith( join( process.cwd(), 'custom_directory' ), { recursive: true } );
	} );

	it( 'creates a template file', async () => {
		const expectedFilePath = join( process.cwd(), CHANGESET_DIRECTORY, EXPECTED_FILE_NAME );

		await template.generateTemplate();

		expect( mocks.copyFile ).toHaveBeenCalledWith(
			TEMPLATE_FILE,
			expectedFilePath,
			expect.any( Number )
		);
	} );

	it( 'creates a template file respecting custom `template` option', async () => {
		const expectedTemplatePath = join( process.cwd(), 'custom_template.md' );

		await template.generateTemplate( {
			template: 'custom_template.md'
		} );

		expect( mocks.copyFile ).toHaveBeenCalledWith(
			expectedTemplatePath,
			expect.any( String ),
			expect.any( Number )
		);
	} );

	it( 'respects options containing absolute paths', async () => {
		const cwd = join( process.cwd(), 'custom_cwd' );

		const options = {
			cwd,
			directory: join( cwd, 'custom_directory' ),
			template: join( cwd, 'custom_template.md' )
		};

		await template.generateTemplate( options );

		expect( mocks.mkdir ).toHaveBeenCalledWith( options.directory, { recursive: true } );
		expect( mocks.copyFile ).toHaveBeenCalledWith(
			options.template,
			join( options.directory, EXPECTED_FILE_NAME ),
			expect.any( Number )
		);
	} );

	it( 'respects options containing relative paths', async () => {
		const options = {
			cwd: 'custom_cwd',
			directory: 'custom_directory',
			template: 'custom_template.md'
		};

		await template.generateTemplate( options );

		expect( mocks.mkdir ).toHaveBeenCalledWith( join( process.cwd(), 'custom_cwd', options.directory ), { recursive: true } );
		expect( mocks.copyFile ).toHaveBeenCalledWith(
			join( process.cwd(), 'custom_cwd', options.template ),
			join( process.cwd(), 'custom_cwd', options.directory, EXPECTED_FILE_NAME ),
			expect.any( Number )
		);
	} );

	it( 'respects options passed via CLI arguments', async () => {
		const flags = [
			'--cwd=custom_cwd',
			'--directory=custom_directory',
			'--template=custom_template.md'
		];

		mockCliArgs( ...flags );

		await template.generateTemplate();

		expect( mocks.mkdir ).toHaveBeenCalledWith( join( process.cwd(), 'custom_cwd', 'custom_directory' ), { recursive: true } );
		expect( mocks.copyFile ).toHaveBeenCalledWith(
			join( process.cwd(), 'custom_cwd', 'custom_template.md' ),
			join( process.cwd(), 'custom_cwd', 'custom_directory', EXPECTED_FILE_NAME ),
			expect.any( Number )
		);
	} );

	it( 'logs a message when file is created', async () => {
		await template.generateTemplate();

		expect( mocks.log ).toHaveBeenCalledWith(
			expect.stringContaining( `Changelog file created: ${ join( CHANGESET_DIRECTORY, EXPECTED_FILE_NAME ) }` )
		);
	} );

	it( 'retries creating the file if it already exists', async () => {
		mockSetTimeout();
		mocks.copyFile.mockRejectedValueOnce( 'File already exists' );

		await template.generateTemplate( { retries: 1 } );
		expect( mocks.copyFile ).toHaveBeenCalledTimes( 2 ); // First intentionally failed attempt, then a successful one.
	} );

	it( 'logs an error when file with given name already exists and `retries` reached limit', async () => {
		mockSetTimeout();
		mocks.copyFile.mockRejectedValue( 'File already exists' );

		await expect( () => template.generateTemplate( { retries: 1 } ) ).rejects.toThrow( 'File already exists' );
		expect( mocks.error ).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining( 'You are going to fast 🥵 Waiting 1 second to ensure unique changelog name.' )
		);
	} );

	it( 'logs an error when git branch name could not be retrieved', async () => {
		const processExitSpy = vi.spyOn( process, 'exit' ).mockImplementation( ( () => {} ) as any );

		mocks.promisify.mockImplementation( () => vi.fn().mockRejectedValue( new Error( 'Git error' ) ) );

		await template.generateTemplate();

		expect( mocks.error ).toHaveBeenCalledWith(
			expect.stringContaining( 'Error: Git is not installed or the current folder is not in git repository.' )
		);
		expect( processExitSpy ).toHaveBeenCalledWith( 1 );
	} );
} );

