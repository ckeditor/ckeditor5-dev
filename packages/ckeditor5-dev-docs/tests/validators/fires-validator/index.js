/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const utils = require( '../../utils' );

describe( 'dev-docs/validators/fires-validator', function() {
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

	it( 'should warn if fired event does not exist', () => {
		const expectedErrors = [
			{
				identifier: '#event:event-non-existing',
				source: 'fires.ts:15'
			},
			{
				identifier: '#event:property',
				source: 'fires.ts:15'
			},
			{
				identifier: '#event:event-non-existing',
				source: 'fires.ts:27'
			},
			{
				identifier: '#event:property',
				source: 'fires.ts:27'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:event-non-existing',
				source: 'firesabsolute.ts:15'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:property',
				source: 'firesabsolute.ts:15'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:event-non-existing',
				source: 'firesabsolute.ts:21'
			},
			{
				identifier: 'module:fixtures/fires~ClassWithFires#event:property',
				source: 'firesabsolute.ts:21'
			}
		];

		const calls = typeDocInstance.logger.warn.getCalls().filter( call => call.firstArg.startsWith( '[@fires validator]' ) );

		expect( calls ).to.lengthOf( expectedErrors.length );

		for ( const error of expectedErrors ) {
			expect( typeDocInstance.logger.warn ).to.be.calledWith(
				`[@fires validator] Event "${ error.identifier }" is not found (${ error.source }).`
			);
		}
	} );
} );
