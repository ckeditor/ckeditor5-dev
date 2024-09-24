/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import upload from '../lib/upload.js';

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import { verifyProperties, createLogger } from '../lib/utils.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import transifexService from '../lib/transifexservice.js';

const {
	tableConstructorSpy,
	tablePushMock,
	tableToStringMock
} = vi.hoisted( () => {
	return {
		tableConstructorSpy: vi.fn(),
		tablePushMock: vi.fn(),
		tableToStringMock: vi.fn()
	};
} );

vi.mock( '../lib/transifexservice.js' );
vi.mock( '../lib/utils.js' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'fs/promises' );
vi.mock( 'path' );

vi.mock( 'chalk', () => ( {
	default: {
		cyan: vi.fn( string => string ),
		gray: vi.fn( string => string ),
		italic: vi.fn( string => string ),
		underline: vi.fn( string => string )
	}
} ) );

vi.mock( 'cli-table', () => {
	return {
		default: class {
			constructor( ...args ) {
				tableConstructorSpy( ...args );

				this.push = tablePushMock;
				this.toString = tableToStringMock;
			}
		}
	};
} );

vi.mock( '/home/ckeditor5-with-errors/.transifex-failed-uploads.json', () => ( {
	default: {
		'ckeditor5-non-existing-01': [
			'Resource with this Slug and Project already exists.'
		],
		'ckeditor5-non-existing-02': [
			'Object not found. It may have been deleted or not been created yet.'
		]
	}
} ) );

describe( 'dev-transifex/upload()', () => {
	let loggerProgressMock, loggerInfoMock, loggerWarningMock, loggerErrorMock, loggerLogMock;

	beforeEach( () => {
		vi.mocked( path.join ).mockImplementation( ( ...args ) => args.join( '/' ) );

		loggerProgressMock = vi.fn();
		loggerInfoMock = vi.fn();
		loggerWarningMock = vi.fn();
		loggerErrorMock = vi.fn();
		loggerErrorMock = vi.fn();

		vi.mocked( fs.lstat ).mockRejectedValue();

		vi.mocked( createLogger ).mockImplementation( () => {
			return {
				progress: loggerProgressMock,
				info: loggerInfoMock,
				warning: loggerWarningMock,
				error: loggerErrorMock,
				_log: loggerLogMock
			};
		} );
	} );

	afterEach( () => {
		vi.resetAllMocks();
	} );

	it( 'should reject a promise if required properties are not specified', () => {
		const error = new Error( 'The specified object misses the following properties: packages.' );
		const config = {
			cwd: '/home/ckeditor5',
			token: 'token',
			organizationName: 'ckeditor',
			projectName: 'ckeditor5'
		};

		vi.mocked( verifyProperties ).mockImplementation( () => {
			throw new Error( error );
		} );

		return upload( config )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				caughtError => {
					expect( caughtError.message.endsWith( error.message ) ).toEqual( true );

					expect( vi.mocked( verifyProperties ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( verifyProperties ) ).toHaveBeenCalledWith(
						config, [ 'token', 'organizationName', 'projectName', 'cwd', 'packages' ]
					);
				}
			);
	} );

	it( 'should store an error log if cannot find the project details', async () => {
		const packages = new Map( [
			[ 'ckeditor5-existing-11', 'build/.transifex/ckeditor5-existing-11' ]
		] );

		vi.mocked( transifexService.getProjectData ).mockRejectedValue( new Error( 'Invalid auth' ) );

		const config = {
			packages,
			cwd: '/home/ckeditor5',
			token: 'token',
			organizationName: 'ckeditor',
			projectName: 'ckeditor5'
		};

		await upload( config );

		expect( vi.mocked( loggerErrorMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( loggerErrorMock ) ).toHaveBeenNthCalledWith(
			1, 'Cannot find project details for "ckeditor/ckeditor5".'
		);
		expect( vi.mocked( loggerErrorMock ) ).toHaveBeenNthCalledWith(
			2, 'Make sure you specified a valid auth token or an organization/project names.'
		);

		expect( vi.mocked( transifexService.getProjectData ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( transifexService.getProjectData ) ).toHaveBeenCalledWith(
			'ckeditor', 'ckeditor5', [ ...packages.keys() ]
		);

		expect( vi.mocked( transifexService.createResource ) ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should create a new resource if the package is processed for the first time', async () => {
		const packages = new Map( [
			[ 'ckeditor5-non-existing-01', 'build/.transifex/ckeditor5-non-existing-01' ]
		] );

		const config = {
			packages,
			cwd: '/home/ckeditor5',
			token: 'token',
			organizationName: 'ckeditor',
			projectName: 'ckeditor5'
		};

		vi.mocked( transifexService.getProjectData ).mockResolvedValue( { resources: [] } );
		vi.mocked( transifexService.createResource ).mockResolvedValue();
		vi.mocked( transifexService.createSourceFile ).mockResolvedValue( 'uuid-01' );
		vi.mocked( transifexService.getResourceUploadDetails ).mockResolvedValue(
			createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 0, 0, 0 )
		);

		vi.mocked( tools.createSpinner ).mockReturnValue( {
			start: vi.fn(),
			finish: vi.fn()
		} );

		await upload( config );

		expect( vi.mocked( transifexService.createResource ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( transifexService.createResource ) ).toHaveBeenCalledWith( {
			organizationName: 'ckeditor',
			projectName: 'ckeditor5',
			resourceName: 'ckeditor5-non-existing-01'
		} );
	} );

	it( 'should not create a new resource if the package exists on Transifex', async () => {
		const packages = new Map( [
			[ 'ckeditor5-existing-11', 'build/.transifex/ckeditor5-existing-11' ]
		] );

		const config = {
			packages,
			cwd: '/home/ckeditor5',
			token: 'token',
			organizationName: 'ckeditor',
			projectName: 'ckeditor5'
		};

		vi.mocked( transifexService.getProjectData ).mockResolvedValue( {
			resources: [
				{ attributes: { name: 'ckeditor5-existing-11' } }
			]
		} );

		vi.mocked( transifexService.createSourceFile ).mockResolvedValue( 'uuid-11' );

		vi.mocked( transifexService.getResourceUploadDetails ).mockResolvedValue(
			createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 )
		);

		vi.mocked( tools.createSpinner ).mockReturnValue( {
			start: vi.fn(),
			finish: vi.fn()
		} );

		await upload( config );

		expect( vi.mocked( transifexService.createResource ) ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should send a new translation source to Transifex', async () => {
		const packages = new Map( [
			[ 'ckeditor5-existing-11', 'build/.transifex/ckeditor5-existing-11' ]
		] );

		const config = {
			packages,
			cwd: '/home/ckeditor5',
			token: 'token',
			organizationName: 'ckeditor',
			projectName: 'ckeditor5'
		};

		vi.mocked( transifexService.getProjectData ).mockResolvedValue( {
			resources: [
				{ attributes: { name: 'ckeditor5-existing-11' } }
			]
		} );

		vi.mocked( transifexService.createSourceFile ).mockResolvedValue( 'uuid-11' );

		vi.mocked( transifexService.getResourceUploadDetails ).mockResolvedValue(
			createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 )
		);

		vi.mocked( fs.readFile ).mockResolvedValue( '# Example file.' );

		vi.mocked( tools.createSpinner ).mockReturnValue( {
			start: vi.fn(),
			finish: vi.fn()
		} );

		await upload( config );

		expect( vi.mocked( fs.readFile ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs.readFile ) ).toHaveBeenCalledWith(
			'/home/ckeditor5/build/.transifex/ckeditor5-existing-11/en.pot', 'utf-8'
		);

		expect( vi.mocked( transifexService.createSourceFile ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( transifexService.createSourceFile ) ).toHaveBeenCalledWith( {
			organizationName: 'ckeditor',
			projectName: 'ckeditor5',
			resourceName: 'ckeditor5-existing-11',
			content: '# Example file.'
		} );

		expect( vi.mocked( transifexService.getResourceUploadDetails ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( transifexService.getResourceUploadDetails ) ).toHaveBeenCalledWith( 'uuid-11' );
	} );

	it( 'should keep informed a developer what the script does', async () => {
		const packages = new Map( [
			[ 'ckeditor5-non-existing-01', 'build/.transifex/ckeditor5-non-existing-01' ]
		] );

		const config = {
			packages,
			cwd: '/home/ckeditor5',
			token: 'token',
			organizationName: 'ckeditor',
			projectName: 'ckeditor5'
		};

		vi.mocked( transifexService.getProjectData ).mockResolvedValue( {
			resources: []
		} );

		vi.mocked( transifexService.createResource ).mockResolvedValue();
		vi.mocked( transifexService.createSourceFile ).mockResolvedValue( 'uuid-01' );
		vi.mocked( transifexService.getResourceUploadDetails ).mockResolvedValue(
			createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 0, 0, 0 )
		);

		const packageSpinner = {
			start: vi.fn(),
			finish: vi.fn()
		};
		const processSpinner = {
			start: vi.fn(),
			finish: vi.fn()
		};

		vi.mocked( tools.createSpinner ).mockReturnValueOnce( packageSpinner );
		vi.mocked( tools.createSpinner ).mockReturnValueOnce( processSpinner );

		vi.mocked( tableToStringMock ).mockReturnValue( '┻━┻' );

		await upload( config );

		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenCalledWith( '┻━┻' );

		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenCalledTimes( 4 );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith( 1, 'Fetching project information...' );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith( 2, 'Uploading new translations...' );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith( 3 );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith( 4, 'Done.' );

		expect( vi.mocked( tools.createSpinner ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( tools.createSpinner ) ).toHaveBeenNthCalledWith(
			1, 'Processing "ckeditor5-non-existing-01"', { emoji: '👉', indentLevel: 1 }
		);
		expect( vi.mocked( tools.createSpinner ) ).toHaveBeenNthCalledWith(
			2, 'Collecting responses... It takes a while.'
		);

		expect( packageSpinner.start ).toHaveBeenCalled();
		expect( packageSpinner.finish ).toHaveBeenCalled();
		expect( processSpinner.start ).toHaveBeenCalled();
		expect( processSpinner.finish ).toHaveBeenCalled();
		expect( vi.mocked( chalk.gray ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( chalk.italic ) ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'error handling', () => {
		let packages, config;

		beforeEach( () => {
			packages = new Map( [
				[ 'ckeditor5-non-existing-03', 'build/.transifex/ckeditor5-non-existing-03' ],
				[ 'ckeditor5-non-existing-04', 'build/.transifex/ckeditor5-non-existing-04' ],
				[ 'ckeditor5-non-existing-01', 'build/.transifex/ckeditor5-non-existing-01' ],
				[ 'ckeditor5-non-existing-02', 'build/.transifex/ckeditor5-non-existing-02' ]
			] );

			config = {
				packages,
				cwd: '/home/ckeditor5-with-errors',
				token: 'token',
				organizationName: 'ckeditor',
				projectName: 'ckeditor5'
			};

			vi.mocked( fs.lstat ).mockResolvedValueOnce();

			vi.mocked( transifexService.getProjectData ).mockResolvedValue( {
				resources: []
			} );

			vi.mocked( transifexService.createResource ).mockResolvedValue();

			vi.mocked( transifexService.createSourceFile ).mockImplementation( options => {
				if ( options.resourceName === 'ckeditor5-non-existing-01' ) {
					return Promise.resolve( 'uuid-01' );
				}

				if ( options.resourceName === 'ckeditor5-non-existing-02' ) {
					return Promise.resolve( 'uuid-02' );
				}

				return Promise.reject( { errors: [] } );
			} );

			vi.mocked( fs.readFile ).mockImplementation( path => {
				if ( path === config.cwd + '/build/.transifex/ckeditor5-non-existing-01/en.pot' ) {
					return Promise.resolve( '# ckeditor5-non-existing-01' );
				}

				if ( path === config.cwd + '/build/.transifex/ckeditor5-non-existing-02/en.pot' ) {
					return Promise.resolve( '# ckeditor5-non-existing-02' );
				}

				return Promise.resolve( '' );
			} );

			vi.mocked( transifexService.getResourceUploadDetails ).mockImplementation( id => {
				if ( id === 'uuid-01' ) {
					return Promise.resolve(
						createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 3, 0, 0 )
					);
				}

				if ( id === 'uuid-02' ) {
					return Promise.resolve(
						createResourceUploadDetailsResponse( 'ckeditor5-non-existing-02', 0, 0, 0 )
					);
				}

				return Promise.reject();
			} );

			vi.mocked( tools.createSpinner ).mockReturnValue( {
				start: vi.fn(),
				finish: vi.fn()
			} );
		} );

		it( 'should process packages specified in the ".transifex-failed-uploads.json" file', async () => {
			await upload( config );

			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
				1, 'Found the file containing a list of packages that failed during the last script execution.'
			);
			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
				2, 'The script will process only packages listed in the file instead of all passed as "config.packages".'
			);

			expect( vi.mocked( fs.readFile ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( transifexService.createResource ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( transifexService.createSourceFile ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( transifexService.getResourceUploadDetails ) ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should remove the ".transifex-failed-uploads.json" file if finished with no errors', async () => {
			await upload( config );

			expect( vi.mocked( fs.unlink ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs.unlink ) ).toHaveBeenCalledWith( '/home/ckeditor5-with-errors/.transifex-failed-uploads.json' );
		} );

		it( 'should store an error in the ".transifex-failed-uploads.json" file (cannot create a resource)', async () => {
			const firstSpinner = {
				start: vi.fn(),
				finish: vi.fn()
			};

			vi.mocked( tools.createSpinner ).mockReturnValueOnce( firstSpinner );

			const error = {
				message: 'JsonApiError: 409',
				errors: [
					{
						detail: 'Resource with this Slug and Project already exists.'
					}
				]
			};

			vi.mocked( transifexService.createResource ).mockRejectedValueOnce( error );
			vi.mocked( transifexService.createResource ).mockResolvedValueOnce();

			await upload( config );

			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenCalledTimes( 5 );
			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
				3, 'Not all translations were uploaded due to errors in Transifex API.'
			);
			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
				4, 'Review the "/home/ckeditor5-with-errors/.transifex-failed-uploads.json" file for more details.'
			);
			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
				5, 'Re-running the script will process only packages specified in the file.'
			);

			expect( firstSpinner.finish ).toHaveBeenCalledTimes( 1 );
			expect( firstSpinner.finish ).toHaveBeenCalledWith( { emoji: '❌' } );

			expect( vi.mocked( fs.writeFile ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs.writeFile ) ).toHaveBeenCalledWith(
				'/home/ckeditor5-with-errors/.transifex-failed-uploads.json',
				JSON.stringify( {
					'ckeditor5-non-existing-01': [ 'Resource with this Slug and Project already exists.' ]
				}, null, 2 ) + '\n',
				'utf-8'
			);
		} );

		it( 'should store an error in the ".transifex-failed-uploads.json" file (cannot upload a translation)', async () => {
			const firstSpinner = {
				start: vi.fn(),
				finish: vi.fn()
			};

			vi.mocked( tools.createSpinner ).mockReturnValueOnce( firstSpinner );

			const error = {
				message: 'JsonApiError: 409',
				errors: [
					{
						detail: 'Object not found. It may have been deleted or not been created yet.'
					}
				]
			};

			vi.mocked( transifexService.createSourceFile ).mockRejectedValueOnce( error );

			await upload( config );

			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenCalledTimes( 5 );
			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
				3, 'Not all translations were uploaded due to errors in Transifex API.'
			);
			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
				4, 'Review the "/home/ckeditor5-with-errors/.transifex-failed-uploads.json" file for more details.'
			);
			expect( vi.mocked( loggerWarningMock ) ).toHaveBeenNthCalledWith(
				5, 'Re-running the script will process only packages specified in the file.'
			);

			expect( vi.mocked( fs.writeFile ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs.writeFile ) ).toHaveBeenCalledWith(
				'/home/ckeditor5-with-errors/.transifex-failed-uploads.json',
				JSON.stringify( {
					'ckeditor5-non-existing-01': [ 'Object not found. It may have been deleted or not been created yet.' ]
				}, null, 2 ) + '\n',
				'utf-8'
			);

			expect( firstSpinner.finish ).toHaveBeenCalledTimes( 1 );
			expect( firstSpinner.finish ).toHaveBeenCalledWith( { emoji: '❌' } );
		} );

		it( 'should store an error in the ".transifex-failed-uploads.json" file (cannot get a status of upload)', async () => {
			const error = {
				message: 'JsonApiError: 409',
				errors: [
					{
						detail: 'Object not found. It may have been deleted or not been created yet.'
					}
				]
			};

			vi.mocked( transifexService.getResourceUploadDetails ).mockRejectedValueOnce( error );

			await upload( config );

			expect( loggerWarningMock ).toHaveBeenCalledTimes( 5 );
			expect( loggerWarningMock ).toHaveBeenNthCalledWith(
				3, 'Not all translations were uploaded due to errors in Transifex API.'
			);
			expect( loggerWarningMock ).toHaveBeenNthCalledWith(
				4, 'Review the "/home/ckeditor5-with-errors/.transifex-failed-uploads.json" file for more details.'
			);
			expect( loggerWarningMock ).toHaveBeenNthCalledWith(
				5, 'Re-running the script will process only packages specified in the file.'
			);

			expect( vi.mocked( fs.writeFile ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fs.writeFile ) ).toHaveBeenCalledWith(
				'/home/ckeditor5-with-errors/.transifex-failed-uploads.json',
				JSON.stringify( {
					'ckeditor5-non-existing-01': [ 'Object not found. It may have been deleted or not been created yet.' ]
				}, null, 2 ) + '\n',
				'utf-8'
			);
		} );
	} );

	describe( 'processing multiple packages', () => {
		let packages, config;

		beforeEach( () => {
			packages = new Map( [
				[ 'ckeditor5-existing-11', 'build/.transifex/ckeditor5-existing-11' ],
				[ 'ckeditor5-existing-14', 'build/.transifex/ckeditor5-existing-14' ],
				[ 'ckeditor5-non-existing-03', 'build/.transifex/ckeditor5-non-existing-03' ],
				[ 'ckeditor5-non-existing-01', 'build/.transifex/ckeditor5-non-existing-01' ],
				[ 'ckeditor5-existing-13', 'build/.transifex/ckeditor5-existing-13' ],
				[ 'ckeditor5-non-existing-02', 'build/.transifex/ckeditor5-non-existing-02' ],
				[ 'ckeditor5-existing-12', 'build/.transifex/ckeditor5-existing-12' ]
			] );

			config = {
				packages,
				cwd: '/home/ckeditor5',
				token: 'token',
				organizationName: 'ckeditor',
				projectName: 'ckeditor5'
			};

			vi.mocked( transifexService.createSourceFile ).mockResolvedValue( 'uuid-xx' );

			vi.mocked( transifexService.createSourceFile ).mockResolvedValue( 'uuid-xx' );

			// Mock resources on Transifex.
			vi.mocked( transifexService.getProjectData ).mockResolvedValue( {
				resources: [
					{ attributes: { name: 'ckeditor5-existing-11' } },
					{ attributes: { name: 'ckeditor5-existing-12' } },
					{ attributes: { name: 'ckeditor5-existing-13' } },
					{ attributes: { name: 'ckeditor5-existing-14' } }
				]
			} );

			vi.mocked( transifexService.createResource ).mockResolvedValue();

			vi.mocked( transifexService.getResourceUploadDetails )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-existing-14', 0, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-non-existing-03', 1, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 3, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-existing-13', 2, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-non-existing-02', 0, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-existing-12', 0, 1, 1 ) );

			vi.mocked( tools.createSpinner ).mockReturnValue( {
				start: vi.fn(),
				finish: vi.fn()
			} );
		} );

		it( 'should handle all packages', async () => {
			await upload( config );

			expect( vi.mocked( transifexService.getProjectData ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( transifexService.createResource ) ).toHaveBeenCalledTimes( 3 );
			expect( vi.mocked( transifexService.createSourceFile ) ).toHaveBeenCalledTimes( 7 );
			expect( vi.mocked( transifexService.getResourceUploadDetails ) ).toHaveBeenCalledTimes( 7 );
			expect( vi.mocked( tools.createSpinner ) ).toHaveBeenCalledTimes( 8 );
		} );

		it( 'should display a summary table with sorted packages (new, has changes, A-Z)', async () => {
			await upload( config );

			expect( vi.mocked( tablePushMock ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( tablePushMock ) ).toHaveBeenCalledWith(
				[ 'ckeditor5-non-existing-01', '🆕', '3', '0', '0' ],
				[ 'ckeditor5-non-existing-03', '🆕', '1', '0', '0' ],
				[ 'ckeditor5-non-existing-02', '🆕', '0', '0', '0' ],
				[ 'ckeditor5-existing-12', '', '0', '1', '1' ],
				[ 'ckeditor5-existing-13', '', '2', '0', '0' ],
				[ 'ckeditor5-existing-11', '', '0', '0', '0' ],
				[ 'ckeditor5-existing-14', '', '0', '0', '0' ]
			);

			// 1x for printing "It takes a while",
			// 5x for each column, x2 for each resource.
			expect( vi.mocked( chalk.gray ) ).toHaveBeenCalledTimes( 11 );
		} );

		it( 'should not display a summary table if none of the packages were processed', async () => {
			config.packages = new Map();

			await upload( config );

			expect( vi.mocked( tablePushMock ) ).toHaveBeenCalledTimes( 0 );
		} );
	} );
} );

/**
 * Returns an object that looks like a response from Transifex API.
 *
 * @param {string} packageName
 * @param {number} created
 * @param {number} updated
 * @param {number} deleted
 * @returns {object}
 */
function createResourceUploadDetailsResponse( packageName, created, updated, deleted ) {
	return {
		related: {
			resource: {
				id: `o:ckeditor:p:ckeditor5:r:${ packageName }`
			}
		},
		attributes: {
			details: {
				strings_created: created,
				strings_updated: updated,
				strings_deleted: deleted
			}
		}
	};
}
