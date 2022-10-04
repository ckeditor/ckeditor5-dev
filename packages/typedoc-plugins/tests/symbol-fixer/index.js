/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const TypeDoc = require( 'typedoc' );
const mockery = require( 'mockery' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/symbol-fixer', () => {
	let typeDoc, stubs;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			chalk: {
				yellow: sinon.stub().callsFake( str => str ),
				bold: sinon.stub().callsFake( str => str ),
				underline: sinon.stub().callsFake( str => str )
			}
		};

		mockery.registerMock( 'chalk', stubs.chalk );

		typeDoc = new TypeDoc.Application();

		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		mockery.disable();
	} );

	it( 'converts symbols enclosed in square brackets', () => {
		const conversionResult = runTypedoc( 'iterator' );

		const module = Object.values( conversionResult.reflections ).find( item => item.originalName === '[iterator]' );

		expect( module.name ).to.equal( 'Symbol.iterator' );
	} );

	it( 'prints warning when square brackets contain invalid symbol', () => {
		const consoleStub = sinon.stub( console, 'log' );
		const conversionResult = runTypedoc( 'fake' );
		consoleStub.restore();

		const module = Object.values( conversionResult.reflections ).find( item => item.originalName === '[fake]' );

		expect( module.name ).to.equal( '[fake]' );
		expect( consoleStub.callCount ).to.equal( 2 );
		expect( consoleStub.firstCall.args[ 0 ] ).to.equal( 'Non-symbol wrapped in square brackets: [fake]' );
		expect( consoleStub.secondCall.args[ 0 ] ).to.equal( `Source: ${ module.sources[ 0 ].fullFileName }` );
	} );

	/**
	 * Allows executing Typedoc for a specific fixture.
	 *
	 * @param {String} filename
	 * @returns {Object} typeDoc.convert() result.
	 */
	function runTypedoc( filename ) {
		const fixturesPath = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'symbol-fixer', 'fixtures' );
		const testFilePath = utils.normalizePath( fixturesPath, `${ filename }.ts` );

		typeDoc.bootstrap( {
			logLevel: 'Error',
			entryPoints: [ testFilePath ],
			plugin: [
				require.resolve( '@ckeditor/typedoc-plugins/lib/symbol-fixer' )
			],
			// TODO: To resolve once the same problem is fixed in the `@ckeditor/ckeditor5-dev-docs` package.
			tsconfig: utils.normalizePath( fixturesPath, 'tsconfig.json' )
		} );

		const conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );

		return conversionResult;
	}
} );

