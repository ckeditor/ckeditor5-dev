/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const testUtils = require( '../../utils' );

describe( 'dev-docs/validators/overloads-validator', function() {
	this.timeout( 10 * 1000 );

	const FIXTURES_PATH = testUtils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = testUtils.normalizePath( FIXTURES_PATH, '**', '*.ts' );
	const TSCONFIG_PATH = testUtils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	const onErrorCallback = sinon.stub();

	before( async () => {
		const validators = proxyquire( '../../../lib/validators', {
			'./overloads-validator': project => {
				return require( '../../../lib/validators/overloads-validator' )( project, onErrorCallback );
			},
			'./module-validator': sinon.spy()
		} );

		const build = proxyquire( '../../../lib/buildtypedoc', {
			'./validators': validators
		} );

		const logStub = sinon.stub( console, 'log' );

		await build( {
			type: 'typedoc',
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ SOURCE_FILES ],
			strict: false,
			validatorOptions: {
				enableOverloadValidator: true
			}
		} );

		logStub.restore();
	} );

	it( 'should warn if overloaded signature does not have "@label" tag', () => {
		const expectedErrors = [
			{ source: 'overloadsinvalid.ts:34' },
			{ source: 'overloadsinvalid.ts:36' },
			{ source: 'overloadsinvalid.ts:18' },
			{ source: 'overloadsinvalid.ts:24' }
		];

		const errorCalls = onErrorCallback.getCalls().filter( call => {
			return call.args[ 0 ] === 'Overloaded signature misses the @label tag';
		} );

		expect( errorCalls.length ).to.equal( expectedErrors.length );

		expectedErrors.forEach( ( { source }, index ) => {
			const currentValue = testUtils.getSource( errorCalls[ index ].args[ 1 ] );

			expect( currentValue ).to.equal( source );
		} );
	} );

	it( 'should warn if overloaded signatures use the same identifier', () => {
		const expectedErrors = [
			{ source: 'overloadsinvalid.ts:51', error: 'Duplicated name: "NOT_SO_UNIQUE" in the @label tag' }
		];

		const errorCalls = onErrorCallback.getCalls().filter( call => {
			return call.args[ 0 ].startsWith( 'Duplicated name' );
		} );

		expect( errorCalls.length ).to.equal( expectedErrors.length );

		expectedErrors.forEach( ( { source, error }, index ) => {
			const [ message, reflection ] = errorCalls[ index ].args;
			const currentValue = testUtils.getSource( reflection );

			expect( message ).to.equal( error );
			expect( currentValue ).to.equal( source );
		} );
	} );
} );
