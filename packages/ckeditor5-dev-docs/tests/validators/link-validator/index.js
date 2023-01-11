/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const utils = require( '../../utils' );

describe( 'dev-docs/validators/link-validator', function() {
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
				source: 'links.ts:49'
			},
			{
				identifier: '#staticProperty',
				source: 'links.ts:49'
			},
			{
				identifier: '#property-non-existing',
				source: 'links.ts:49'
			},
			{
				identifier: '#property:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#method:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#methodWithoutComment:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#methodWithoutLabel:LABEL-NON-EXISTING',
				source: 'links.ts:49'
			},
			{
				identifier: '#event-example',
				source: 'links.ts:49'
			},
			{
				identifier: '#event:property',
				source: 'links.ts:49'
			},
			{
				identifier: '~ClassNonExisting#property',
				source: 'links.ts:49'
			},
			{
				identifier: 'module:non-existing/module~ClassWithLinks#property',
				source: 'links.ts:49'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:13'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:62'
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:99'
			}
		];

		const calls = typeDocInstance.logger.warn.getCalls().filter( call => call.firstArg.startsWith( '[@link validator]' ) );

		expect( calls ).to.lengthOf( expectedErrors.length );

		for ( const error of expectedErrors ) {
			expect( typeDocInstance.logger.warn ).to.be.calledWith(
				`[@link validator] Target doclet for "${ error.identifier }" identifier is not found (${ error.source }).`
			);
		}
	} );
} );
