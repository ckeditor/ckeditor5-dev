/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const utils = require( '../../utils' );

describe( 'dev-docs/validators/overloads-validator', function() {
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

	it( 'should warn if overloaded signature does not have "@label" tag', () => {
		const expectedErrors = [
			{ source: 'overloadsinvalid.ts:18' },
			{ source: 'overloadsinvalid.ts:24' },
			{ source: 'overloadsinvalid.ts:34' },
			{ source: 'overloadsinvalid.ts:36' }
		];

		const calls = typeDocInstance.logger.warn.getCalls().filter( call => call.firstArg.startsWith( '[overloads validator]' ) );

		expect( calls ).to.lengthOf( expectedErrors.length );

		for ( const error of expectedErrors ) {
			expect( typeDocInstance.logger.warn ).to.be.calledWith(
				`[overloads validator] Missing "@label" tag for overloaded signature (${ error.source }).`
			);
		}
	} );
} );
