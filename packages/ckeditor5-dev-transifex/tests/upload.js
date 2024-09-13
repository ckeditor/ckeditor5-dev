/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import upload from '../lib/upload.js';

const {
	fsReadFileMock,
	fsWriteFileMock,
	fsUnlinkMock,
	fsLstatMock,
	pathJoinMock,
	tableConstructorSpy,
	tablePushMock,
	tableToStringMock,
	chalkGrayMock,
	chalkCyanMock,
	chalkItalicMock,
	chalkUnderlineMock,
	transifexServiceInitMock,
	transifexServiceGetProjectDataMock,
	transifexServiceCreateResourceMock,
	transifexServiceCreateSourceFileMock,
	transifexServiceGetResourceUploadDetailsMock,
	utilsVerifyPropertiesMock,
	utilsCreateLoggerMock,
	toolsCreateSpinnerMock
} = vi.hoisted( () => {
	return {
		fsReadFileMock: vi.fn(),
		fsWriteFileMock: vi.fn(),
		fsUnlinkMock: vi.fn(),
		fsLstatMock: vi.fn(),
		pathJoinMock: vi.fn(),
		tableConstructorSpy: vi.fn(),
		tablePushMock: vi.fn(),
		tableToStringMock: vi.fn(),
		chalkGrayMock: vi.fn(),
		chalkCyanMock: vi.fn(),
		chalkItalicMock: vi.fn(),
		chalkUnderlineMock: vi.fn(),
		transifexServiceInitMock: vi.fn(),
		transifexServiceGetProjectDataMock: vi.fn(),
		transifexServiceCreateResourceMock: vi.fn(),
		transifexServiceCreateSourceFileMock: vi.fn(),
		transifexServiceGetResourceUploadDetailsMock: vi.fn(),
		utilsVerifyPropertiesMock: vi.fn(),
		utilsCreateLoggerMock: vi.fn(),
		toolsCreateSpinnerMock: vi.fn()
	};
} );

vi.mock( 'fs/promises', () => {
	return {
		default: {
			readFile: fsReadFileMock,
			writeFile: fsWriteFileMock,
			unlink: fsUnlinkMock,
			lstat: fsLstatMock
		}
	};
} );

vi.mock( 'path', () => {
	return {
		default: {
			join: pathJoinMock
		}
	};
} );

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

vi.mock( 'chalk', () => {
	return {
		default: {
			gray: chalkGrayMock,
			cyan: chalkCyanMock,
			italic: chalkItalicMock,
			underline: chalkUnderlineMock
		}
	};
} );

vi.mock( '../lib/transifexservice.js', () => {
	return {
		default: {
			init: transifexServiceInitMock,
			getProjectData: transifexServiceGetProjectDataMock,
			createResource: transifexServiceCreateResourceMock,
			createSourceFile: transifexServiceCreateSourceFileMock,
			getResourceUploadDetails: transifexServiceGetResourceUploadDetailsMock
		}
	};
} );

vi.mock( '../lib/utils.js', () => {
	return {
		verifyProperties: utilsVerifyPropertiesMock,
		createLogger: utilsCreateLoggerMock
	};
} );

vi.mock( '@ckeditor/ckeditor5-dev-utils', () => {
	return {
		tools: {
			createSpinner: toolsCreateSpinnerMock
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
		vi.mocked( chalkGrayMock ).mockImplementation( string => string );
		vi.mocked( chalkCyanMock ).mockImplementation( string => string );
		vi.mocked( chalkItalicMock ).mockImplementation( string => string );
		vi.mocked( chalkUnderlineMock ).mockImplementation( string => string );

		vi.mocked( pathJoinMock ).mockImplementation( ( ...args ) => args.join( '/' ) );

		loggerProgressMock = vi.fn();
		loggerInfoMock = vi.fn();
		loggerWarningMock = vi.fn();
		loggerErrorMock = vi.fn();
		loggerErrorMock = vi.fn();

		vi.mocked( fsLstatMock ).mockRejectedValue();

		vi.mocked( utilsCreateLoggerMock ).mockImplementation( () => {
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

		vi.mocked( utilsVerifyPropertiesMock ).mockImplementation( () => {
			throw new Error( error );
		} );

		return upload( config )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				caughtError => {
					expect( caughtError.message.endsWith( error.message ) ).toEqual( true );

					expect( vi.mocked( utilsVerifyPropertiesMock ) ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( utilsVerifyPropertiesMock ) ).toHaveBeenCalledWith(
						config, [ 'token', 'organizationName', 'projectName', 'cwd', 'packages' ]
					);
				}
			);
	} );

	it( 'should store an error log if cannot find the project details', async () => {
		const packages = new Map( [
			[ 'ckeditor5-existing-11', 'build/.transifex/ckeditor5-existing-11' ]
		] );

		vi.mocked( transifexServiceGetProjectDataMock ).mockRejectedValue( new Error( 'Invalid auth' ) );

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

		expect( vi.mocked( transifexServiceGetProjectDataMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( transifexServiceGetProjectDataMock ) ).toHaveBeenCalledWith(
			'ckeditor', 'ckeditor5', [ ...packages.keys() ]
		);

		expect( vi.mocked( transifexServiceCreateResourceMock ) ).toHaveBeenCalledTimes( 0 );
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

		vi.mocked( transifexServiceGetProjectDataMock ).mockResolvedValue( { resources: [] } );
		vi.mocked( transifexServiceCreateResourceMock ).mockResolvedValue();
		vi.mocked( transifexServiceCreateSourceFileMock ).mockResolvedValue( 'uuid-01' );
		vi.mocked( transifexServiceGetResourceUploadDetailsMock ).mockResolvedValue(
			createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 0, 0, 0 )
		);

		vi.mocked( toolsCreateSpinnerMock ).mockReturnValue( {
			start: vi.fn(),
			finish: vi.fn()
		} );

		await upload( config );

		expect( vi.mocked( transifexServiceCreateResourceMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( transifexServiceCreateResourceMock ) ).toHaveBeenCalledWith( {
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

		vi.mocked( transifexServiceGetProjectDataMock ).mockResolvedValue( {
			resources: [
				{ attributes: { name: 'ckeditor5-existing-11' } }
			]
		} );

		vi.mocked( transifexServiceCreateSourceFileMock ).mockResolvedValue( 'uuid-11' );

		vi.mocked( transifexServiceGetResourceUploadDetailsMock ).mockResolvedValue(
			createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 )
		);

		vi.mocked( toolsCreateSpinnerMock ).mockReturnValue( {
			start: vi.fn(),
			finish: vi.fn()
		} );

		await upload( config );

		expect( vi.mocked( transifexServiceCreateResourceMock ) ).toHaveBeenCalledTimes( 0 );
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

		vi.mocked( transifexServiceGetProjectDataMock ).mockResolvedValue( {
			resources: [
				{ attributes: { name: 'ckeditor5-existing-11' } }
			]
		} );

		vi.mocked( transifexServiceCreateSourceFileMock ).mockResolvedValue( 'uuid-11' );

		vi.mocked( transifexServiceGetResourceUploadDetailsMock ).mockResolvedValue(
			createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 )
		);

		vi.mocked( fsReadFileMock ).mockResolvedValue( '# Example file.' );

		vi.mocked( toolsCreateSpinnerMock ).mockReturnValue( {
			start: vi.fn(),
			finish: vi.fn()
		} );

		await upload( config );

		expect( vi.mocked( fsReadFileMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fsReadFileMock ) ).toHaveBeenCalledWith(
			'/home/ckeditor5/build/.transifex/ckeditor5-existing-11/en.pot', 'utf-8'
		);

		expect( vi.mocked( transifexServiceCreateSourceFileMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( transifexServiceCreateSourceFileMock ) ).toHaveBeenCalledWith( {
			organizationName: 'ckeditor',
			projectName: 'ckeditor5',
			resourceName: 'ckeditor5-existing-11',
			content: '# Example file.'
		} );

		expect( vi.mocked( transifexServiceGetResourceUploadDetailsMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( transifexServiceGetResourceUploadDetailsMock ) ).toHaveBeenCalledWith( 'uuid-11' );
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

		vi.mocked( transifexServiceGetProjectDataMock ).mockResolvedValue( {
			resources: []
		} );

		vi.mocked( transifexServiceCreateResourceMock ).mockResolvedValue();
		vi.mocked( transifexServiceCreateSourceFileMock ).mockResolvedValue( 'uuid-01' );
		vi.mocked( transifexServiceGetResourceUploadDetailsMock ).mockResolvedValue(
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

		vi.mocked( toolsCreateSpinnerMock ).mockReturnValueOnce( packageSpinner );
		vi.mocked( toolsCreateSpinnerMock ).mockReturnValueOnce( processSpinner );

		vi.mocked( tableToStringMock ).mockReturnValue( '┻━┻' );

		await upload( config );

		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( loggerInfoMock ) ).toHaveBeenCalledWith( '┻━┻' );

		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenCalledTimes( 4 );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith( 1, 'Fetching project information...' );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith( 2, 'Uploading new translations...' );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith( 3 );
		expect( vi.mocked( loggerProgressMock ) ).toHaveBeenNthCalledWith( 4, 'Done.' );

		expect( vi.mocked( toolsCreateSpinnerMock ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( toolsCreateSpinnerMock ) ).toHaveBeenNthCalledWith(
			1, 'Processing "ckeditor5-non-existing-01"', { emoji: '👉', indentLevel: 1 }
		);
		expect( vi.mocked( toolsCreateSpinnerMock ) ).toHaveBeenNthCalledWith(
			2, 'Collecting responses... It takes a while.'
		);

		expect( packageSpinner.start ).toHaveBeenCalled();
		expect( packageSpinner.finish ).toHaveBeenCalled();
		expect( processSpinner.start ).toHaveBeenCalled();
		expect( processSpinner.finish ).toHaveBeenCalled();
		expect( vi.mocked( chalkGrayMock ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( chalkItalicMock ) ).toHaveBeenCalledTimes( 1 );
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

			vi.mocked( fsLstatMock ).mockResolvedValueOnce();

			vi.mocked( transifexServiceGetProjectDataMock ).mockResolvedValue( {
				resources: []
			} );

			vi.mocked( transifexServiceCreateResourceMock ).mockResolvedValue();

			vi.mocked( transifexServiceCreateSourceFileMock ).mockImplementation( options => {
				if ( options.resourceName === 'ckeditor5-non-existing-01' ) {
					return Promise.resolve( 'uuid-01' );
				}

				if ( options.resourceName === 'ckeditor5-non-existing-02' ) {
					return Promise.resolve( 'uuid-02' );
				}

				return Promise.reject( { errors: [] } );
			} );

			vi.mocked( fsReadFileMock ).mockImplementation( path => {
				if ( path === config.cwd + '/build/.transifex/ckeditor5-non-existing-01/en.pot' ) {
					return Promise.resolve( '# ckeditor5-non-existing-01' );
				}

				if ( path === config.cwd + '/build/.transifex/ckeditor5-non-existing-02/en.pot' ) {
					return Promise.resolve( '# ckeditor5-non-existing-02' );
				}

				return Promise.resolve( '' );
			} );

			vi.mocked( transifexServiceGetResourceUploadDetailsMock ).mockImplementation( id => {
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

			vi.mocked( toolsCreateSpinnerMock ).mockReturnValue( {
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

			expect( vi.mocked( fsReadFileMock ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( transifexServiceCreateResourceMock ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( transifexServiceCreateSourceFileMock ) ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( transifexServiceGetResourceUploadDetailsMock ) ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should remove the ".transifex-failed-uploads.json" file if finished with no errors', async () => {
			await upload( config );

			expect( vi.mocked( fsUnlinkMock ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fsUnlinkMock ) ).toHaveBeenCalledWith( '/home/ckeditor5-with-errors/.transifex-failed-uploads.json' );
		} );

		it( 'should store an error in the ".transifex-failed-uploads.json" file (cannot create a resource)', async () => {
			const firstSpinner = {
				start: vi.fn(),
				finish: vi.fn()
			};

			vi.mocked( toolsCreateSpinnerMock ).mockReturnValueOnce( firstSpinner );

			const error = {
				message: 'JsonApiError: 409',
				errors: [
					{
						detail: 'Resource with this Slug and Project already exists.'
					}
				]
			};

			vi.mocked( transifexServiceCreateResourceMock ).mockRejectedValueOnce( error );
			vi.mocked( transifexServiceCreateResourceMock ).mockResolvedValueOnce();

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

			expect( vi.mocked( fsWriteFileMock ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fsWriteFileMock ) ).toHaveBeenCalledWith(
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

			vi.mocked( toolsCreateSpinnerMock ).mockReturnValueOnce( firstSpinner );

			const error = {
				message: 'JsonApiError: 409',
				errors: [
					{
						detail: 'Object not found. It may have been deleted or not been created yet.'
					}
				]
			};

			vi.mocked( transifexServiceCreateSourceFileMock ).mockRejectedValueOnce( error );

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

			expect( vi.mocked( fsWriteFileMock ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fsWriteFileMock ) ).toHaveBeenCalledWith(
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

			vi.mocked( transifexServiceGetResourceUploadDetailsMock ).mockRejectedValueOnce( error );

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

			expect( vi.mocked( fsWriteFileMock ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( fsWriteFileMock ) ).toHaveBeenCalledWith(
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

			vi.mocked( transifexServiceCreateSourceFileMock ).mockResolvedValue( 'uuid-xx' );

			vi.mocked( transifexServiceCreateSourceFileMock ).mockResolvedValue( 'uuid-xx' );

			// Mock resources on Transifex.
			vi.mocked( transifexServiceGetProjectDataMock ).mockResolvedValue( {
				resources: [
					{ attributes: { name: 'ckeditor5-existing-11' } },
					{ attributes: { name: 'ckeditor5-existing-12' } },
					{ attributes: { name: 'ckeditor5-existing-13' } },
					{ attributes: { name: 'ckeditor5-existing-14' } }
				]
			} );

			vi.mocked( transifexServiceCreateResourceMock ).mockResolvedValue();

			vi.mocked( transifexServiceGetResourceUploadDetailsMock )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-existing-14', 0, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-non-existing-03', 1, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 3, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-existing-13', 2, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-non-existing-02', 0, 0, 0 ) )
				.mockResolvedValueOnce( createResourceUploadDetailsResponse( 'ckeditor5-existing-12', 0, 1, 1 ) );

			vi.mocked( toolsCreateSpinnerMock ).mockReturnValue( {
				start: vi.fn(),
				finish: vi.fn()
			} );
		} );

		it( 'should handle all packages', async () => {
			await upload( config );

			expect( vi.mocked( transifexServiceGetProjectDataMock ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( transifexServiceCreateResourceMock ) ).toHaveBeenCalledTimes( 3 );
			expect( vi.mocked( transifexServiceCreateSourceFileMock ) ).toHaveBeenCalledTimes( 7 );
			expect( vi.mocked( transifexServiceGetResourceUploadDetailsMock ) ).toHaveBeenCalledTimes( 7 );
			expect( vi.mocked( toolsCreateSpinnerMock ) ).toHaveBeenCalledTimes( 8 );
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
			expect( vi.mocked( chalkGrayMock ) ).toHaveBeenCalledTimes( 11 );
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
 * @param {String} packageName
 * @param {Number} created
 * @param {Number} updated
 * @param {Number} deleted
 * @returns {Object}
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
