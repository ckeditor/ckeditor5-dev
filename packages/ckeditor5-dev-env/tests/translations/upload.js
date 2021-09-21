/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const proxyquire = require( 'proxyquire' );

describe( 'upload', () => {
	let sandbox, stubs, upload, packageNames, serverResources, fileContents;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			logger: {
				info: sandbox.stub(),
				warning: sandbox.stub(),
				error: sandbox.stub()
			},

			transifexService: {
				getResources: sandbox.spy( () => Promise.resolve( serverResources ) ),
				postResource: sandbox.stub().resolves( [] ),
				putResourceContent: sandbox.stub().resolves( {} )
			},

			fs: {
				readdirSync: sandbox.spy( () => packageNames ),
				createReadStream: sandbox.spy( fileName => fileContents[ fileName ] )
			},

			table: {
				constructor: sinon.stub(),
				push: sinon.stub(),
				toString: sinon.stub()
			},

			chalk: {
				gray: sinon.stub(),
				underline: sinon.stub()
			}
		};

		mockery.registerMock( './transifex-service', stubs.transifexService );

		mockery.registerMock( 'cli-table', class Table {
			constructor( ...args ) {
				stubs.table.constructor( ...args );
			}

			push( ...args ) {
				return stubs.table.push( ...args );
			}

			toString( ...args ) {
				return stubs.table.toString( ...args );
			}
		} );

		sandbox.stub( process, 'cwd' ).returns( path.join( 'workspace', 'ckeditor5' ) );

		upload = proxyquire( '../../lib/translations/upload', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger: () => stubs.logger
			},
			'fs': stubs.fs,
			'chalk': {
				gray: stubs.chalk.gray.callsFake( msg => msg ),
				underline: stubs.chalk.underline.callsFake( msg => msg )
			}
		} );
	} );

	afterEach( () => {
		mockery.disable();
		sandbox.restore();
	} );

	it( 'should create and update resources on the Transifex', () => {
		packageNames = [
			'ckeditor5-core',
			'ckeditor5-ui'
		];

		serverResources = [ {
			slug: 'ckeditor5-core'
		} ];

		fileContents = {
			'workspace/ckeditor5/build/.transifex/ckeditor5-ui/en.pot': '# ckeditor-ui en.pot content',
			'workspace/ckeditor5/build/.transifex/ckeditor5-core/en.pot': '# ckeditor-core en.pot content'
		};

		return upload( { token: 'secretToken' } )
			.then( () => {
				sinon.assert.calledOnce( stubs.transifexService.getResources );
				sinon.assert.calledWithExactly(
					stubs.fs.readdirSync, path.posix.join( 'workspace', 'ckeditor5', 'build', '.transifex' )
				);

				sinon.assert.calledOnce( stubs.transifexService.postResource );
				sinon.assert.calledWithExactly( stubs.transifexService.postResource, {
					token: 'secretToken',
					name: 'ckeditor5-ui',
					slug: 'ckeditor5-ui',
					content: '# ckeditor-ui en.pot content'
				} );

				sinon.assert.calledOnce( stubs.transifexService.putResourceContent );

				sinon.assert.calledWithExactly( stubs.transifexService.putResourceContent, {
					token: 'secretToken',
					slug: 'ckeditor5-core',
					name: 'ckeditor5-core',
					content: '# ckeditor-core en.pot content'
				} );
			} );
	} );

	it( 'should report an error and throw it when something goes wrong', () => {
		const error = new Error();
		stubs.transifexService.getResources = sandbox.spy( () => Promise.reject( error ) );

		return upload( { token: 'secretToken' } )
			.then( () => {
				throw new Error( 'It should throws an error' );
			}, err => {
				expect( err ).to.equal( error );
				sinon.assert.calledOnce( stubs.logger.error );
				sinon.assert.calledWithExactly( stubs.logger.error, error );
			} );
	} );

	it( 'should print a table with summary (created and updated items)', () => {
		stubs.table.toString.onFirstCall().returns( '┻━┻' );
		stubs.table.toString.onSecondCall().returns( '┳━┳' );

		// Random order by design.
		packageNames = [
			'ckeditor5-widget',
			'ckeditor5-ui',
			'ckeditor5-utils',
			'ckeditor5-engine',
			'ckeditor5-basic-styles',
			'ckeditor5-link',
			'ckeditor5-core',
			'ckeditor5-autoformat'
		];

		// Existing resources.
		serverResources = [
			{ slug: 'ckeditor5-core' },
			{ slug: 'ckeditor5-basic-styles' },
			{ slug: 'ckeditor5-engine' },
			{ slug: 'ckeditor5-autoformat' }
		];

		stubs.transifexService.postResource.reset();

		stubs.transifexService.postResource.onCall( 0 ).resolves( [ 4 ] );
		stubs.transifexService.postResource.onCall( 1 ).resolves( [ 2 ] );
		stubs.transifexService.postResource.onCall( 2 ).resolves( [ 1 ] );
		stubs.transifexService.postResource.onCall( 3 ).resolves( [ 5 ] );

		stubs.transifexService.putResourceContent.reset();

		stubs.transifexService.putResourceContent.onCall( 0 ).resolves( { strings_added: 1, strings_updated: 0, strings_delete: 3 } );
		stubs.transifexService.putResourceContent.onCall( 1 ).resolves( { strings_added: 1, strings_updated: 2, strings_delete: 0 } );
		stubs.transifexService.putResourceContent.onCall( 2 ).resolves( { strings_added: 0, strings_updated: 0, strings_delete: 0 } );
		stubs.transifexService.putResourceContent.onCall( 3 ).resolves( { strings_added: 0, strings_updated: 0, strings_delete: 0 } );

		fileContents = {};

		for ( const item of packageNames ) {
			fileContents[ `workspace/ckeditor5/build/.transifex/${ item }/en.pot` ] = `# ${ item } en.pot content`;
		}

		return upload( { token: 'secretToken' } )
			.then( () => {
				expect( stubs.logger.info.callCount ).to.equal( 13 );

				// Parsed packages. Info log about processing.
				expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-widget"...' );
				expect( stubs.logger.info.getCall( 1 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-ui"...' );
				expect( stubs.logger.info.getCall( 2 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-utils"...' );
				expect( stubs.logger.info.getCall( 3 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-engine"...' );
				expect( stubs.logger.info.getCall( 4 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-basic-styles"...' );
				expect( stubs.logger.info.getCall( 5 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-link"...' );
				expect( stubs.logger.info.getCall( 6 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-core"...' );
				expect( stubs.logger.info.getCall( 7 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-autoformat"...' );

				// Finished parsing packages.
				expect( stubs.logger.info.getCall( 8 ).args[ 0 ] ).to.equal( 'All resources uploaded.\n' );

				// Drawing the tables.
				expect( stubs.logger.info.getCall( 9 ).args[ 0 ] ).to.equal( 'Created resources:\n' );
				expect( stubs.logger.info.getCall( 10 ).args[ 0 ] ).to.equal( '┻━┻\n' );
				expect( stubs.logger.info.getCall( 11 ).args[ 0 ] ).to.equal( 'Updated resources:\n' );
				expect( stubs.logger.info.getCall( 12 ).args[ 0 ] ).to.equal( '┳━┳' );

				// Each package should be added into a table.
				expect( stubs.table.push.callCount ).to.equal( 8 );

				// Packages should be sorted by their names.
				// Calls 1-4 are for new (created) resources.
				expect( stubs.table.push.getCall( 0 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-link', 5 ] );
				expect( stubs.table.push.getCall( 1 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-ui', 2 ] );
				expect( stubs.table.push.getCall( 2 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-utils', 1 ] );
				expect( stubs.table.push.getCall( 3 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-widget', 4 ] );

				// Calls 5-8 are for updated resources.
				// First should be displayed packages with changes, then no changes items.
				expect( stubs.table.push.getCall( 4 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-basic-styles', 1, 2, 0 ] );
				expect( stubs.table.push.getCall( 5 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-engine', 1, 0, 3 ] );
				expect( stubs.table.push.getCall( 6 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-autoformat', 0, 0, 0 ] );
				expect( stubs.table.push.getCall( 7 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-core', 0, 0, 0 ] );

				// Both table headers should be underlined.
				expect( stubs.chalk.underline.callCount ).to.equal( 2 );
				expect( stubs.chalk.underline.getCall( 0 ).args[ 0 ] ).to.equal( 'Created resources:' );
				expect( stubs.chalk.underline.getCall( 1 ).args[ 0 ] ).to.equal( 'Updated resources:' );

				// Updated packages with no changes should be grayed out.
				// Each package calls the function 4 times.
				expect( stubs.chalk.gray.callCount ).to.equal( 8 );
				expect( stubs.chalk.gray.getCall( 0 ).args[ 0 ] ).to.equal( 'ckeditor5-autoformat' );
				expect( stubs.chalk.gray.getCall( 1 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 2 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 3 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 4 ).args[ 0 ] ).to.equal( 'ckeditor5-core' );
				expect( stubs.chalk.gray.getCall( 5 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 6 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 7 ).args[ 0 ] ).to.equal( 0 );
			} );
	} );

	it( 'should print a table with summary (created items only)', () => {
		stubs.table.toString.onFirstCall().returns( '┻━┻' );

		// Random order by design.
		packageNames = [
			'ckeditor5-widget',
			'ckeditor5-ui',
			'ckeditor5-utils',
			'ckeditor5-link'
		];

		// Existing resources.
		serverResources = [];

		stubs.transifexService.postResource.reset();

		stubs.transifexService.postResource.onCall( 0 ).resolves( [ 4 ] );
		stubs.transifexService.postResource.onCall( 1 ).resolves( [ 2 ] );
		stubs.transifexService.postResource.onCall( 2 ).resolves( [ 1 ] );
		stubs.transifexService.postResource.onCall( 3 ).resolves( [ 5 ] );

		fileContents = {};

		for ( const item of packageNames ) {
			fileContents[ `workspace/ckeditor5/build/.transifex/${ item }/en.pot` ] = `# ${ item } en.pot content`;
		}

		return upload( { token: 'secretToken' } )
			.then( () => {
				expect( stubs.logger.info.callCount ).to.equal( 7 );

				// Parsed packages. Info log about processing.
				expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-widget"...' );
				expect( stubs.logger.info.getCall( 1 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-ui"...' );
				expect( stubs.logger.info.getCall( 2 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-utils"...' );
				expect( stubs.logger.info.getCall( 3 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-link"...' );

				// Finished parsing packages.
				expect( stubs.logger.info.getCall( 4 ).args[ 0 ] ).to.equal( 'All resources uploaded.\n' );

				// Drawing the tables.
				expect( stubs.logger.info.getCall( 5 ).args[ 0 ] ).to.equal( 'Created resources:\n' );
				expect( stubs.logger.info.getCall( 6 ).args[ 0 ] ).to.equal( '┻━┻\n' );

				// Each package should be added into a table.
				expect( stubs.table.push.callCount ).to.equal( 4 );

				expect( stubs.table.push.getCall( 0 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-link', 5 ] );
				expect( stubs.table.push.getCall( 1 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-ui', 2 ] );
				expect( stubs.table.push.getCall( 2 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-utils', 1 ] );
				expect( stubs.table.push.getCall( 3 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-widget', 4 ] );

				// A table header should be underlined.
				expect( stubs.chalk.underline.callCount ).to.equal( 1 );
				expect( stubs.chalk.underline.getCall( 0 ).args[ 0 ] ).to.equal( 'Created resources:' );
			} );
	} );

	it( 'should print a table with summary (updated items only)', () => {
		stubs.table.toString.onFirstCall().returns( '┳━┳' );

		// Random order by design.
		packageNames = [
			'ckeditor5-engine',
			'ckeditor5-basic-styles',
			'ckeditor5-core',
			'ckeditor5-autoformat'
		];

		// Existing resources.
		serverResources = [
			{ slug: 'ckeditor5-core' },
			{ slug: 'ckeditor5-basic-styles' },
			{ slug: 'ckeditor5-engine' },
			{ slug: 'ckeditor5-autoformat' }
		];

		stubs.transifexService.putResourceContent.reset();

		stubs.transifexService.putResourceContent.onCall( 0 ).resolves( { strings_added: 1, strings_updated: 0, strings_delete: 3 } );
		stubs.transifexService.putResourceContent.onCall( 1 ).resolves( { strings_added: 1, strings_updated: 2, strings_delete: 0 } );
		stubs.transifexService.putResourceContent.onCall( 2 ).resolves( { strings_added: 0, strings_updated: 0, strings_delete: 0 } );
		stubs.transifexService.putResourceContent.onCall( 3 ).resolves( { strings_added: 0, strings_updated: 0, strings_delete: 0 } );

		fileContents = {};

		for ( const item of packageNames ) {
			fileContents[ `workspace/ckeditor5/build/.transifex/${ item }/en.pot` ] = `# ${ item } en.pot content`;
		}

		return upload( { token: 'secretToken' } )
			.then( () => {
				expect( stubs.logger.info.callCount ).to.equal( 7 );

				// Parsed packages. Info log about processing.
				expect( stubs.logger.info.getCall( 0 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-engine"...' );
				expect( stubs.logger.info.getCall( 1 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-basic-styles"...' );
				expect( stubs.logger.info.getCall( 2 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-core"...' );
				expect( stubs.logger.info.getCall( 3 ).args[ 0 ] ).to.equal( 'Processing "ckeditor5-autoformat"...' );

				// Finished parsing packages.
				expect( stubs.logger.info.getCall( 4 ).args[ 0 ] ).to.equal( 'All resources uploaded.\n' );

				// Drawing the tables.
				expect( stubs.logger.info.getCall( 5 ).args[ 0 ] ).to.equal( 'Updated resources:\n' );
				expect( stubs.logger.info.getCall( 6 ).args[ 0 ] ).to.equal( '┳━┳' );

				// Each package should be added into a table.
				expect( stubs.table.push.callCount ).to.equal( 4 );

				expect( stubs.table.push.getCall( 0 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-basic-styles', 1, 2, 0 ] );
				expect( stubs.table.push.getCall( 1 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-engine', 1, 0, 3 ] );
				expect( stubs.table.push.getCall( 2 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-autoformat', 0, 0, 0 ] );
				expect( stubs.table.push.getCall( 3 ).args[ 0 ] ).to.deep.equal( [ 'ckeditor5-core', 0, 0, 0 ] );

				// A table header should be underlined.
				expect( stubs.chalk.underline.callCount ).to.equal( 1 );
				expect( stubs.chalk.underline.getCall( 0 ).args[ 0 ] ).to.equal( 'Updated resources:' );

				expect( stubs.chalk.gray.callCount ).to.equal( 8 );
				expect( stubs.chalk.gray.getCall( 0 ).args[ 0 ] ).to.equal( 'ckeditor5-autoformat' );
				expect( stubs.chalk.gray.getCall( 1 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 2 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 3 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 4 ).args[ 0 ] ).to.equal( 'ckeditor5-core' );
				expect( stubs.chalk.gray.getCall( 5 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 6 ).args[ 0 ] ).to.equal( 0 );
				expect( stubs.chalk.gray.getCall( 7 ).args[ 0 ] ).to.equal( 0 );
			} );
	} );
} );
