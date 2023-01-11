/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const utils = require( '../../utils' );

describe( 'dev-docs/validators/see-validator', function() {
	this.timeout( 10 * 1000 );

	const FIXTURES_PATH = utils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = utils.normalizePath( FIXTURES_PATH, '**', '*.ts' );
	const TSCONFIG_PATH = utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	let typeDocInstance;

	before( async () => {
		const build = proxyquire( '../../../lib/build', {
			'./validators': {
				validate( project, typeDoc ) {
					typeDocInstance = typeDoc;

					sinon.stub( typeDoc.logger, 'info' ).callsFake();
					sinon.stub( typeDoc.logger, 'warn' ).callsFake();
					sinon.stub( typeDoc.logger, 'error' ).callsFake();

					return require( '../../../lib/validators' ).validate( project, typeDoc );
				}
			}
		} );

		await build( {
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ SOURCE_FILES ],
			validateOnly: false,
			strict: false
		} );
	} );

	it( 'should warn if link is not valid', () => {
		const expectedErrors = [
			{
				identifier: '.property',
				source: 'see.ts:60'
			},
			{
				identifier: '#staticProperty',
				source: 'see.ts:60'
			},
			{
				identifier: '#property-non-existing',
				source: 'see.ts:60'
			},
			{
				identifier: '#property:LABEL-NON-EXISTING',
				source: 'see.ts:60'
			},
			{
				identifier: '#method:LABEL-NON-EXISTING',
				source: 'see.ts:60'
			},
			{
				identifier: '#methodWithoutComment:LABEL-NON-EXISTING',
				source: 'see.ts:60'
			},
			{
				identifier: '#methodWithoutLabel:LABEL-NON-EXISTING',
				source: 'see.ts:60'
			},
			{
				identifier: '#event-example',
				source: 'see.ts:60'
			},
			{
				identifier: '#event:property',
				source: 'see.ts:60'
			},
			{
				identifier: '~ClassNonExisting#property',
				source: 'see.ts:60'
			},
			{
				identifier: 'module:non-existing/module~ClassWithSeeTags#property',
				source: 'see.ts:60'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'see.ts:97'
			}
		];

		const calls = typeDocInstance.logger.warn.getCalls().filter( call => call.firstArg.startsWith( '[@see validator]' ) );

		expect( calls ).to.lengthOf( expectedErrors.length );

		for ( const error of expectedErrors ) {
			expect( typeDocInstance.logger.warn ).to.be.calledWith(
				`[@see validator] Target doclet for "${ error.identifier }" identifier is not found (${ error.source }).`
			);
		}
	} );
} );
