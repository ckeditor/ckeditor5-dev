/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'generateSourceFiles()', () => {
	const sandbox = sinon.sandbox.create();
	let collect, stubs;

	beforeEach( () => {
		stubs = {
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},

			generationUtils: {
				getContexts: sandbox.stub(),
				collectTranslations: sandbox.stub().returns( [] ),
				getUnusedContextErrorMessages: sandbox.stub().returns( [] ),
				getMissingContextErrorMessages: sandbox.stub().returns( [] ),
				getRepeatedContextErrorMessages: sandbox.stub().returns( [] ),
				createPotFileHeader: sandbox.stub(),
				createPotFileContent: sandbox.stub(),
				savePotFile: sandbox.spy(),
				removeExistingPotFiles: sandbox.spy(),
			}
		};

		collect = proxyquire( '../../lib/translations/generatesourcefiles', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger: () => stubs.logger
			},
			'./source-files-generation-utils': stubs.generationUtils
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should collect translations', () => {
		stubs.generationUtils.getContexts.returns( new Map( [
			[
				'ckeditor5-ui',
				{
					filePath: 'path/to/file',
					content: {}
				}
			]
		] ) );

		stubs.generationUtils.createPotFileHeader.returns( 'header' );
		stubs.generationUtils.createPotFileContent.returns( 'content' );

		collect();

		sinon.assert.calledOnce( stubs.generationUtils.savePotFile );
		sinon.assert.calledWithExactly( stubs.generationUtils.savePotFile, 'ckeditor5-ui', 'headercontent' );
	} );

	it( 'should log the error and return it when hits one', () => {
		stubs.generationUtils.getContexts.returns( new Map() );
		stubs.generationUtils.getMissingContextErrorMessages.returns( [
			'ckeditor5-core/lang/context.json file is missing'
		] );
		stubs.generationUtils.createPotFileHeader.returns( 'header' );
		stubs.generationUtils.createPotFileContent.returns( 'content' );

		collect();

		sinon.assert.notCalled( stubs.generationUtils.savePotFile );
		sinon.assert.calledWithExactly( stubs.logger.error, 'ckeditor5-core/lang/context.json file is missing' );
	} );

	it( 'should remove existing po files', () => {
		stubs.generationUtils.getContexts.returns( new Map() );

		collect();

		sinon.assert.calledOnce( stubs.generationUtils.removeExistingPotFiles );
	} );
} );
