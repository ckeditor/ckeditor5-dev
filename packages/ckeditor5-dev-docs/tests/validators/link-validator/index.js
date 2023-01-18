/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );
const testUtils = require( '../../utils' );

describe( 'dev-docs/validators/link-validator', function() {
	this.timeout( 10 * 1000 );

	const FIXTURES_PATH = testUtils.normalizePath( __dirname, 'fixtures' );
	const SOURCE_FILES = testUtils.normalizePath( FIXTURES_PATH, '**', '*.ts' );
	const TSCONFIG_PATH = testUtils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );

	const onErrorCallback = sinon.stub();

	before( async () => {
		const validators = proxyquire( '../../../lib/validators', {
			'./link-validator': project => {
				return require( '../../../lib/validators/link-validator' )( project, onErrorCallback );
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
			strict: false
		} );

		logStub.restore();
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
			},
			{
				identifier: 'module:non-existing/module~Foo#bar',
				source: 'links.ts:99'
			}
		];

		expect( onErrorCallback.callCount ).to.equal( expectedErrors.length );

		for ( const error of expectedErrors ) {
			expect( onErrorCallback ).to.be.calledWith(
				`Incorrect link: "${ error.identifier }"`,
				sinon.match( reflection => error.source === testUtils.getSource( reflection ) )
			);
		}
	} );
} );
