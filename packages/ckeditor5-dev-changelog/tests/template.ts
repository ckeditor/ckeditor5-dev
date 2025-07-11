/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'upath';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as template from '../src/template.js';
import { CHANGESET_DIRECTORY, TEMPLATE_FILE } from '../src/utils/constants.js';

const EXPECTED_FILE_NAME = '20250526105803_ck_1234567890_git_branch_name.md';

const mocks = vi.hoisted( () => ( {
	log: vi.fn().mockReturnValue( undefined ),
	warn: vi.fn().mockReturnValue( undefined ),
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

describe( 'generateTemplate', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		vi.setSystemTime( mocks.time );
		vi.stubGlobal( 'console', {
			log: mocks.log,
			warn: mocks.warn,
			error: mocks.error
		} );
	} );

	afterEach( () => {
		vi.useRealTimers();
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	} );

	it( 'creates a directory if necessary', async () => {
		await template.generateTemplate();

		expect( mocks.mkdir ).toHaveBeenCalledWith( join( process.cwd(), CHANGESET_DIRECTORY ), { recursive: true } );
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

	it( 'respects options containing absolute paths', async () => {
		const cwd = join( process.cwd(), 'custom_cwd' );

		const options = {
			directory: join( cwd, 'custom_directory' )
		};

		await template.generateTemplate( options );

		expect( mocks.mkdir ).toHaveBeenCalledWith( options.directory, { recursive: true } );
		expect( mocks.copyFile ).toHaveBeenCalledWith(
			TEMPLATE_FILE,
			join( options.directory, EXPECTED_FILE_NAME ),
			expect.any( Number )
		);
	} );

	it( 'respects options containing relative paths', async () => {
		const options = {
			directory: 'custom_directory'
		};

		await template.generateTemplate( options );

		expect( mocks.mkdir ).toHaveBeenCalledWith( join( process.cwd(), options.directory ), { recursive: true } );
		expect( mocks.copyFile ).toHaveBeenCalledWith(
			TEMPLATE_FILE,
			join( process.cwd(), options.directory, EXPECTED_FILE_NAME ),
			expect.any( Number )
		);
	} );

	it( 'respects options passed via CLI arguments', async () => {
		const flags = [
			'--directory=custom_directory'
		];

		mockCliArgs( ...flags );

		await template.generateTemplate();

		expect( mocks.mkdir ).toHaveBeenCalledWith( join( process.cwd(), 'custom_directory' ), { recursive: true } );
		expect( mocks.copyFile ).toHaveBeenCalledWith(
			TEMPLATE_FILE,
			join( process.cwd(), 'custom_directory', EXPECTED_FILE_NAME ),
			expect.any( Number )
		);
	} );

	it( 'logs a message when file is created', async () => {
		await template.generateTemplate();

		expect( mocks.log ).toHaveBeenCalledWith(
			expect.stringContaining( 'The changelog file has been successfully created.' )
		);

		expect( mocks.log ).toHaveBeenCalledWith(
			expect.stringContaining( `file://${ join( process.cwd(), '.changelog', EXPECTED_FILE_NAME ) }` )
		);
	} );

	it( 'logs a warning when used on potentially restricted branch', async () => {
		mocks.promisify.mockImplementation( () => vi.fn().mockResolvedValue( { stdout: 'master' } ) );

		await template.generateTemplate();

		console.log( {
			a: mocks.warn.mock.calls[ 0 ],
			b: [ 'You are on a protected branch!' ]
		} );

		expect( mocks.warn ).toHaveBeenCalledOnce();
		expect( mocks.warn.mock.calls[ 0 ] ).toEqual( expect.arrayContaining( [ 'You are on a protected branch!' ] ) );
	} );

	it( 'retries creating the file if it already exists', async () => {
		mocks.copyFile.mockImplementation( ( _, dest ) => {
			return dest.endsWith( EXPECTED_FILE_NAME ) ? Promise.reject( 'File already exists' ) : Promise.resolve( 'File created' );
		} );

		const generatePromise = template.generateTemplate();

		await vi.runAllTimersAsync();
		await generatePromise;

		expect( mocks.error ).toHaveBeenCalledTimes( 1 );
		expect( mocks.copyFile ).toHaveBeenCalledTimes( 2 ); // First intentionally failed attempt, then a successful one.
		expect( mocks.copyFile ).toHaveLastResolvedWith( 'File created' );
	} );

	it( 'logs an error when file with given name already exists and `retries` reached limit', async () => {
		mocks.copyFile.mockImplementation( () => Promise.reject( 'File already exists' ) );

		const shouldReject = expect( () => template.generateTemplate() ).rejects.toThrow( 'File already exists' );

		await vi.runAllTimersAsync();
		await shouldReject;

		expect( mocks.error ).toHaveBeenCalledTimes( 6 );
		expect( mocks.error ).toHaveBeenCalledWith(
			expect.stringContaining( 'You are going to fast 🥵 Waiting 1 second to ensure unique changelog name.' )
		);
		expect( mocks.error ).toHaveBeenCalledWith(
			expect.stringContaining( 'Error: Generating changelog file failed with the following error:' )
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

