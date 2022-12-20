/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const { expect } = require( 'chai' );
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-transifex/upload()', () => {
	let stubs, upload;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			fs: {
				readFile: sinon.stub(),
				writeFile: sinon.stub(),
				lstat: sinon.stub(),
				unlink: sinon.stub()
			},

			path: {
				join: sinon.stub().callsFake( ( ...chunks ) => chunks.join( '/' ) )
			},

			logger: {
				progress: sinon.stub(),
				info: sinon.stub(),
				warning: sinon.stub(),
				error: sinon.stub(),
				_log: sinon.stub()
			},

			transifexService: {
				init: sinon.stub(),
				getProjectData: sinon.stub(),
				createResource: sinon.stub(),
				createSourceFile: sinon.stub(),
				getResourceUploadDetails: sinon.stub()
			},

			table: {
				constructor: sinon.stub(),
				push: sinon.stub(),
				toString: sinon.stub()
			},

			tools: {
				createSpinner: sinon.stub()
			},

			chalk: {
				gray: sinon.stub().callsFake( msg => msg ),
				cyan: sinon.stub().callsFake( msg => msg ),
				italic: sinon.stub().callsFake( msg => msg ),
				underline: sinon.stub().callsFake( msg => msg )
			},

			utils: {
				verifyProperties: sinon.stub(),
				createLogger: sinon.stub()
			}
		};

		stubs.utils.createLogger.returns( {
			progress: stubs.logger.progress,
			info: stubs.logger.info,
			warning: stubs.logger.warning,
			error: stubs.logger.error,
			_log: stubs.logger._log
		} );

		// `proxyquire` does not understand dynamic imports.
		mockery.registerMock( '/home/ckeditor5-with-errors/.transifex-failed-uploads.json', {
			'ckeditor5-non-existing-01': [
				'Resource with this Slug and Project already exists.'
			],
			'ckeditor5-non-existing-02': [
				'Object not found. It may have been deleted or not been created yet.'
			]
		} );

		upload = proxyquire( '../lib/upload', {
			'@ckeditor/ckeditor5-dev-utils': {
				tools: stubs.tools
			},
			'path': stubs.path,
			'fs/promises': stubs.fs,
			'chalk': stubs.chalk,
			'cli-table': class Table {
				constructor( ...args ) {
					stubs.table.constructor( ...args );
				}

				push( ...args ) {
					return stubs.table.push( ...args );
				}

				toString( ...args ) {
					return stubs.table.toString( ...args );
				}
			},
			'./transifexservice': stubs.transifexService,
			'./utils': stubs.utils
		} );

		stubs.fs.lstat.withArgs( '/home/ckeditor5/.transifex-failed-uploads.json' ).rejects();
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	it( 'should reject a promise if required properties are not specified', () => {
		const error = new Error( 'The specified object misses the following properties: packages.' );
		const config = {
			cwd: '/home/ckeditor5',
			token: 'token',
			organizationName: 'ckeditor',
			projectName: 'ckeditor5'
		};

		stubs.utils.verifyProperties.throws( error );

		return upload( config )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				err => {
					expect( err ).to.equal( error );

					expect( stubs.utils.verifyProperties.callCount ).to.equal( 1 );
					expect( stubs.utils.verifyProperties.firstCall.args[ 0 ] ).to.deep.equal( config );
					expect( stubs.utils.verifyProperties.firstCall.args[ 1 ] ).to.deep.equal( [
						'token',
						'organizationName',
						'projectName',
						'cwd',
						'packages'
					] );
				}
			);
	} );

	it( 'should store an error log if cannot find the project details', () => {
		const packages = new Map( [
			[ 'ckeditor5-existing-11', 'build/.transifex/ckeditor5-existing-11' ]
		] );

		stubs.transifexService.getProjectData.rejects( new Error( 'Invalid auth' ) );

		const config = {
			packages,
			cwd: '/home/ckeditor5',
			token: 'token',
			organizationName: 'ckeditor',
			projectName: 'ckeditor5'
		};

		return upload( config )
			.then( () => {
				expect( stubs.logger.error.callCount ).to.equal( 2 );
				expect( stubs.logger.error.firstCall.args[ 0 ] ).to.equal( 'Cannot find project details for "ckeditor/ckeditor5".' );
				expect( stubs.logger.error.secondCall.args[ 0 ] ).to.equal(
					'Make sure you specified a valid auth token or an organization/project names.'
				);

				expect( stubs.transifexService.getProjectData.callCount ).to.equal( 1 );
				expect( stubs.transifexService.getProjectData.firstCall.args[ 0 ] ).to.equal( 'ckeditor' );
				expect( stubs.transifexService.getProjectData.firstCall.args[ 1 ] ).to.equal( 'ckeditor5' );
				expect( stubs.transifexService.getProjectData.firstCall.args[ 2 ] ).to.deep.equal( [ ...packages.keys() ] );

				expect( stubs.transifexService.createResource.callCount ).to.equal( 0 );
			} );
	} );

	it( 'should create a new resource if the package is processed for the first time', () => {
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

		stubs.transifexService.getProjectData.resolves( {
			resources: []
		} );

		stubs.transifexService.createResource.resolves();
		stubs.transifexService.createSourceFile.resolves( 'uuid-01' );
		stubs.transifexService.getResourceUploadDetails.resolves(
			createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 0, 0, 0 )
		);

		stubs.tools.createSpinner.returns( {
			start: sinon.stub(),
			finish: sinon.stub()
		} );

		return upload( config )
			.then( () => {
				expect( stubs.transifexService.createResource.callCount ).to.equal( 1 );
				expect( stubs.transifexService.createResource.firstCall.args[ 0 ] ).to.deep.equal( {
					organizationName: 'ckeditor',
					projectName: 'ckeditor5',
					resourceName: 'ckeditor5-non-existing-01'
				} );
			} );
	} );

	it( 'should not create a new resource if the package exists on Transifex', () => {
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

		stubs.transifexService.getProjectData.resolves( {
			resources: [
				{ attributes: { name: 'ckeditor5-existing-11' } }
			]
		} );

		stubs.transifexService.createSourceFile.resolves( 'uuid-11' );

		stubs.transifexService.getResourceUploadDetails.resolves(
			createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 )
		);

		stubs.tools.createSpinner.returns( {
			start: sinon.stub(),
			finish: sinon.stub()
		} );

		return upload( config )
			.then( () => {
				expect( stubs.transifexService.createResource.callCount ).to.equal( 0 );
			} );
	} );

	it( 'should send a new translation source to Transifex', () => {
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

		stubs.transifexService.getProjectData.resolves( {
			resources: [
				{ attributes: { name: 'ckeditor5-existing-11' } }
			]
		} );

		stubs.transifexService.createSourceFile.resolves( 'uuid-11' );

		stubs.transifexService.getResourceUploadDetails.resolves(
			createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 )
		);

		stubs.fs.readFile.resolves( '# Example file.' );

		stubs.tools.createSpinner.returns( {
			start: sinon.stub(),
			finish: sinon.stub()
		} );

		return upload( config )
			.then( () => {
				expect( stubs.fs.readFile.callCount ).to.equal( 1 );
				expect( stubs.fs.readFile.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor5/build/.transifex/ckeditor5-existing-11/en.pot' );
				expect( stubs.fs.readFile.firstCall.args[ 1 ] ).to.equal( 'utf-8' );
				expect( stubs.transifexService.createSourceFile.callCount ).to.equal( 1 );
				expect( stubs.transifexService.createSourceFile.firstCall.args[ 0 ] ).to.deep.equal( {
					organizationName: 'ckeditor',
					projectName: 'ckeditor5',
					resourceName: 'ckeditor5-existing-11',
					content: '# Example file.'
				} );
				expect( stubs.transifexService.getResourceUploadDetails.callCount ).to.equal( 1 );
				expect( stubs.transifexService.getResourceUploadDetails.firstCall.args[ 0 ] ).to.equal( 'uuid-11' );
			} );
	} );

	it( 'should keep informed a developer what the script does', () => {
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

		stubs.transifexService.getProjectData.resolves( {
			resources: []
		} );

		stubs.transifexService.createResource.resolves();
		stubs.transifexService.createSourceFile.resolves( 'uuid-01' );
		stubs.transifexService.getResourceUploadDetails.resolves(
			createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 0, 0, 0 )
		);

		const packageSpinner = {
			start: sinon.stub(),
			finish: sinon.stub()
		};
		const processSpinner = {
			start: sinon.stub(),
			finish: sinon.stub()
		};

		stubs.tools.createSpinner.onFirstCall().returns( packageSpinner );
		stubs.tools.createSpinner.onSecondCall().returns( processSpinner );

		stubs.table.toString.returns( '┻━┻' );

		return upload( config )
			.then( () => {
				expect( stubs.logger.info.callCount ).to.equal( 1 );
				expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.equal( '┻━┻' );

				expect( stubs.logger.progress.callCount ).to.equal( 4 );
				expect( stubs.logger.progress.getCall( 0 ).args[ 0 ] ).to.equal( 'Fetching project information...' );
				expect( stubs.logger.progress.getCall( 1 ).args[ 0 ] ).to.equal( 'Uploading new translations...' );
				expect( stubs.logger.progress.getCall( 2 ).args[ 0 ] ).to.be.undefined;
				expect( stubs.logger.progress.getCall( 3 ).args[ 0 ] ).to.equal( 'Done.' );

				expect( stubs.tools.createSpinner.callCount ).to.equal( 2 );

				expect( stubs.tools.createSpinner.firstCall.args[ 0 ] ).to.equal( 'Processing "ckeditor5-non-existing-01"' );
				expect( stubs.tools.createSpinner.firstCall.args[ 1 ] ).to.deep.equal( {
					emoji: '👉',
					indentLevel: 1
				} );
				expect( stubs.tools.createSpinner.secondCall.args[ 0 ] ).to.equal( 'Collecting responses... It takes a while.' );

				expect( packageSpinner.start.called ).to.equal( true );
				expect( packageSpinner.finish.called ).to.equal( true );
				expect( processSpinner.start.called ).to.equal( true );
				expect( processSpinner.finish.called ).to.equal( true );
				expect( stubs.chalk.gray.callCount ).to.equal( 1 );
				expect( stubs.chalk.italic.callCount ).to.equal( 1 );
			} );
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

			stubs.fs.lstat.withArgs( '/home/ckeditor5-with-errors/.transifex-failed-uploads.json' ).resolves();

			stubs.transifexService.getProjectData.resolves( {
				resources: []
			} );

			stubs.transifexService.createResource.resolves();

			// Mock Tx response when uploading a new translation content.
			stubs.transifexService.createSourceFile.withArgs( {
				organizationName: 'ckeditor',
				projectName: 'ckeditor5',
				resourceName: 'ckeditor5-non-existing-01',
				content: '# ckeditor5-non-existing-01'
			} ).resolves( 'uuid-01' );
			stubs.transifexService.createSourceFile.withArgs( {
				organizationName: 'ckeditor',
				projectName: 'ckeditor5',
				resourceName: 'ckeditor5-non-existing-02',
				content: '# ckeditor5-non-existing-02'
			} ).resolves( 'uuid-02' );

			// Mock translation sources.
			stubs.fs.readFile.withArgs( config.cwd + '/build/.transifex/ckeditor5-non-existing-01/en.pot' )
				.resolves( '# ckeditor5-non-existing-01' );
			stubs.fs.readFile.withArgs( config.cwd + '/build/.transifex/ckeditor5-non-existing-02/en.pot' )
				.resolves( '# ckeditor5-non-existing-02' );

			// Mock upload results.
			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-01' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 3, 0, 0 )
			);
			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-02' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-non-existing-02', 0, 0, 0 )
			);

			stubs.tools.createSpinner.returns( {
				start: sinon.stub(),
				finish: sinon.stub()
			} );
		} );

		it( 'should process packages specified in the ".transifex-failed-uploads.json" file', () => {
			return upload( config )
				.then( () => {
					expect( stubs.logger.warning.callCount ).to.equal( 2 );
					expect( stubs.logger.warning.firstCall.args[ 0 ] ).to.equal(
						'Found the file containing a list of packages that failed during the last script execution.'
					);
					expect( stubs.logger.warning.secondCall.args[ 0 ] ).to.equal(
						'The script will process only packages listed in the file instead of all passed as "config.packages".'
					);

					expect( stubs.fs.readFile.callCount ).to.equal( 2 );
					expect( stubs.transifexService.createResource.callCount ).to.equal( 2 );
					expect( stubs.transifexService.createSourceFile.callCount ).to.equal( 2 );
					expect( stubs.transifexService.getResourceUploadDetails.callCount ).to.equal( 2 );
				} );
		} );

		it( 'should remove the ".transifex-failed-uploads.json" file if finished with no errors', () => {
			return upload( config )
				.then( () => {
					expect( stubs.fs.unlink.callCount ).to.equal( 1 );
					expect( stubs.fs.unlink.firstCall.args[ 0 ] ).to.equal( '/home/ckeditor5-with-errors/.transifex-failed-uploads.json' );
				} );
		} );

		it( 'should store an error in the ".transifex-failed-uploads.json" file (cannot create a resource)', () => {
			const firstSpinner = {
				start: sinon.stub(),
				finish: sinon.stub()
			};

			stubs.tools.createSpinner.onFirstCall().returns( firstSpinner );

			const error = {
				message: 'JsonApiError: 409',
				errors: [
					{
						detail: 'Resource with this Slug and Project already exists.'
					}
				]
			};

			stubs.transifexService.createResource.onFirstCall().rejects( error );
			stubs.transifexService.createResource.onSecondCall().resolves();

			return upload( config )
				.then( () => {
					expect( stubs.logger.warning.callCount ).to.equal( 5 );
					expect( stubs.logger.warning.getCall( 2 ).args[ 0 ] ).to.equal(
						'Not all translations were uploaded due to errors in Transifex API.'
					);
					expect( stubs.logger.warning.getCall( 3 ).args[ 0 ] ).to.equal(
						'Review the "/home/ckeditor5-with-errors/.transifex-failed-uploads.json" file for more details.'
					);
					expect( stubs.logger.warning.getCall( 4 ).args[ 0 ] ).to.equal(
						'Re-running the script will process only packages specified in the file.'
					);

					expect( firstSpinner.finish.callCount ).to.equal( 1 );
					expect( firstSpinner.finish.firstCall.args[ 0 ] ).to.deep.equal( { emoji: '❌' } );

					expect( stubs.fs.writeFile.callCount ).to.equal( 1 );
					expect( stubs.fs.writeFile.firstCall.args[ 0 ] ).to.equal(
						'/home/ckeditor5-with-errors/.transifex-failed-uploads.json'
					);

					const storedErrors = JSON.parse( stubs.fs.writeFile.firstCall.args[ 1 ] );
					expect( storedErrors ).to.deep.equal( {
						'ckeditor5-non-existing-01': [ 'Resource with this Slug and Project already exists.' ]
					} );
				} );
		} );

		it( 'should store an error in the ".transifex-failed-uploads.json" file (cannot upload a translation)', () => {
			const firstSpinner = {
				start: sinon.stub(),
				finish: sinon.stub()
			};

			stubs.tools.createSpinner.onFirstCall().returns( firstSpinner );

			const error = {
				message: 'JsonApiError: 409',
				errors: [
					{
						detail: 'Object not found. It may have been deleted or not been created yet.'
					}
				]
			};

			stubs.transifexService.createSourceFile.withArgs( {
				organizationName: 'ckeditor',
				projectName: 'ckeditor5',
				resourceName: 'ckeditor5-non-existing-01',
				content: '# ckeditor5-non-existing-01'
			} ).rejects( error );

			return upload( config )
				.then( () => {
					expect( stubs.logger.warning.callCount ).to.equal( 5 );
					expect( stubs.logger.warning.getCall( 2 ).args[ 0 ] ).to.equal(
						'Not all translations were uploaded due to errors in Transifex API.'
					);
					expect( stubs.logger.warning.getCall( 3 ).args[ 0 ] ).to.equal(
						'Review the "/home/ckeditor5-with-errors/.transifex-failed-uploads.json" file for more details.'
					);
					expect( stubs.logger.warning.getCall( 4 ).args[ 0 ] ).to.equal(
						'Re-running the script will process only packages specified in the file.'
					);

					expect( firstSpinner.finish.callCount ).to.equal( 1 );
					expect( firstSpinner.finish.firstCall.args[ 0 ] ).to.deep.equal( { emoji: '❌' } );

					expect( stubs.fs.writeFile.callCount ).to.equal( 1 );
					expect( stubs.fs.writeFile.firstCall.args[ 0 ] ).to.equal(
						'/home/ckeditor5-with-errors/.transifex-failed-uploads.json'
					);

					const storedErrors = JSON.parse( stubs.fs.writeFile.firstCall.args[ 1 ] );
					expect( storedErrors ).to.deep.equal( {
						'ckeditor5-non-existing-01': [ 'Object not found. It may have been deleted or not been created yet.' ]
					} );
				} );
		} );

		it( 'should store an error in the ".transifex-failed-uploads.json" file (cannot get a status of upload)', () => {
			const error = {
				message: 'JsonApiError: 409',
				errors: [
					{
						detail: 'Object not found. It may have been deleted or not been created yet.'
					}
				]
			};

			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-01' ).rejects( error );

			return upload( config )
				.then( () => {
					expect( stubs.logger.warning.callCount ).to.equal( 5 );
					expect( stubs.logger.warning.getCall( 2 ).args[ 0 ] ).to.equal(
						'Not all translations were uploaded due to errors in Transifex API.'
					);
					expect( stubs.logger.warning.getCall( 3 ).args[ 0 ] ).to.equal(
						'Review the "/home/ckeditor5-with-errors/.transifex-failed-uploads.json" file for more details.'
					);
					expect( stubs.logger.warning.getCall( 4 ).args[ 0 ] ).to.equal(
						'Re-running the script will process only packages specified in the file.'
					);

					expect( stubs.fs.writeFile.callCount ).to.equal( 1 );
					expect( stubs.fs.writeFile.firstCall.args[ 0 ] ).to.equal(
						'/home/ckeditor5-with-errors/.transifex-failed-uploads.json'
					);

					const storedErrors = JSON.parse( stubs.fs.writeFile.firstCall.args[ 1 ] );
					expect( storedErrors ).to.deep.equal( {
						'ckeditor5-non-existing-01': [ 'Object not found. It may have been deleted or not been created yet.' ]
					} );
				} );
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

			for ( const [ packageName, packagePath ] of packages ) {
				// Mock translation files.
				stubs.fs.readFile.withArgs( config.cwd + '/' + packagePath + '/en.pot' ).resolves( '# ' + packageName );

				// Mock Tx response when uploading a new translation content.
				const uuid = 'uuid-' + packageName.match( /(\d+)$/ )[ 1 ];
				const withArgs = {
					organizationName: 'ckeditor',
					projectName: 'ckeditor5',
					resourceName: packageName,
					content: '# ' + packageName
				};
				stubs.transifexService.createSourceFile.withArgs( withArgs ).resolves( uuid );
			}

			// Mock resources on Transifex.
			stubs.transifexService.getProjectData.resolves( {
				resources: [
					{ attributes: { name: 'ckeditor5-existing-11' } },
					{ attributes: { name: 'ckeditor5-existing-12' } },
					{ attributes: { name: 'ckeditor5-existing-13' } },
					{ attributes: { name: 'ckeditor5-existing-14' } }
				]
			} );

			stubs.transifexService.createResource.resolves();

			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-01' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-non-existing-01', 3, 0, 0 )
			);
			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-02' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-non-existing-02', 0, 0, 0 )
			);
			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-03' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-non-existing-03', 1, 0, 0 )
			);
			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-11' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-existing-11', 0, 0, 0 )
			);
			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-12' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-existing-12', 0, 1, 1 )
			);
			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-13' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-existing-13', 2, 0, 0 )
			);
			stubs.transifexService.getResourceUploadDetails.withArgs( 'uuid-14' ).resolves(
				createResourceUploadDetailsResponse( 'ckeditor5-existing-14', 0, 0, 0 )
			);

			stubs.tools.createSpinner.returns( {
				start: sinon.stub(),
				finish: sinon.stub()
			} );
		} );

		it( 'should handle all packages', () => {
			return upload( config )
				.then( () => {
					expect( stubs.transifexService.getProjectData.callCount ).to.equal( 1 );
					expect( stubs.transifexService.createResource.callCount ).to.equal( 3 );
					expect( stubs.transifexService.createSourceFile.callCount ).to.equal( 7 );
					expect( stubs.transifexService.getResourceUploadDetails.callCount ).to.equal( 7 );
					expect( stubs.tools.createSpinner.callCount ).to.equal( 8 );
				} );
		} );

		it( 'should display a summary table with sorted packages (new, has changes, A-Z)', () => {
			return upload( config )
				.then( () => {
					expect( stubs.table.push.callCount ).to.equal( 1 );
					expect( stubs.table.push.firstCall.args ).to.be.an( 'array' );
					expect( stubs.table.push.firstCall.args ).to.lengthOf( 7 );

					// 1x for printing "It takes a while",
					// 5x for each column, x2 for each resource.
					expect( stubs.chalk.gray.callCount ).to.equal( 11 );

					expect( stubs.table.push.firstCall.args ).to.deep.equal( [
						[ 'ckeditor5-non-existing-01', '🆕', '3', '0', '0' ],
						[ 'ckeditor5-non-existing-03', '🆕', '1', '0', '0' ],
						[ 'ckeditor5-non-existing-02', '🆕', '0', '0', '0' ],
						[ 'ckeditor5-existing-12', '', '0', '1', '1' ],
						[ 'ckeditor5-existing-13', '', '2', '0', '0' ],
						[ 'ckeditor5-existing-11', '', '0', '0', '0' ],
						[ 'ckeditor5-existing-14', '', '0', '0', '0' ]
					] );
				} );
		} );

		it( 'should not display a summary table if none of the packages were processed', () => {
			config.packages = new Map();

			return upload( config )
				.then( () => {
					expect( stubs.table.push.callCount ).to.equal( 0 );
				} );
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
