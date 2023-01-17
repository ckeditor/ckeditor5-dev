/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const testUtils = require( '../../utils' );

describe( 'dev-docs/validators/module-validator', function() {
	this.timeout( 10 * 1000 );

	const FIXTURES_PATH = testUtils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = testUtils.normalizePath( FIXTURES_PATH, '**', '*.ts' );
	const TSCONFIG_PATH = testUtils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	const onErrorCallback = sinon.stub();

	before( async () => {
		const validators = proxyquire( '../../../lib/validators', {
			'./module-validator': project => {
				return require( '../../../lib/validators/module-validator' )( project, onErrorCallback );
			}
		} );

		const build = proxyquire( '../../../lib/build', {
			'./validators': validators
		} );

		await build( {
			cwd: FIXTURES_PATH,
			tsconfig: TSCONFIG_PATH,
			sourceFiles: [ SOURCE_FILES ],
			validateOnly: false,
			strict: false
		} );
	} );

	it( 'should warn if module name is not valid', () => {
		const expectedErrors = [
			{
				source: 'ckeditor5-example/src/modulerootinvalid1.ts:10',
				name: 'example/'
			},
			{
				source: 'ckeditor5-example/src/modulerootinvalid2.ts:10',
				name: 'example/foo'
			},
			{
				source: 'ckeditor5-example/src/feature/modulefeatureinvalid1.ts:10',
				name: 'example/feature'
			},
			{
				source: 'ckeditor5-example/src/feature/modulefeatureinvalid2.ts:10',
				name: 'example/feature/foo'
			},
			{
				source: 'ckeditor5-example/src/feature/nested-feature/modulenestedfeatureinvalid1.ts:10',
				name: 'example/feature/nested-feature'
			},
			{
				source: 'ckeditor5-example/src/feature/nested-feature/modulenestedfeatureinvalid2.ts:10',
				name: 'example/feature/nested-feature/foo'
			}
		];

		expect( onErrorCallback.callCount ).to.equal( expectedErrors.length );

		for ( const error of expectedErrors ) {
			expect( onErrorCallback ).to.be.calledWith(
				`Invalid module name: "${ error.name }"`,
				sinon.match( reflection => error.source === testUtils.getSource( reflection ) )
			);
		}
	} );
} );
