/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/purge-private-api-docs', function() {
	this.timeout( 10 * 1000 );

	let conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'purge-private-api-docs', 'fixtures' );

	before( async () => {
		const sourceFilePatterns = [
			utils.normalizePath( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );
		const typeDoc = new TypeDoc.Application();

		expect( files ).to.not.lengthOf( 0 );

		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		typeDoc.bootstrap( {
			cwd: FIXTURES_PATH,
			logLevel: 'Error',
			entryPoints: files,
			plugin: [
				require.resolve( '@ckeditor/typedoc-plugins/lib/config-provider' ),
				require.resolve( '@ckeditor/typedoc-plugins/lib/module-fixer' ),
				require.resolve( '@ckeditor/typedoc-plugins/lib/purge-private-api-docs' )
			],
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should remove reflections from a private package', () => {
		expect( conversionResult.getChildByName( [ 'private-package/model/model' ] ) ).to.equal( undefined );
		expect( conversionResult.getChildByName( [ 'private-package/view/node/node' ] ) ).to.equal( undefined );
	} );

	it( 'should keep private reflections marked with the `@publicApi` annotation', () => {
		expect( conversionResult.getChildByName( [ 'private-public-api-package/error' ] ) ).to.not.equal( undefined );
	} );

	it( 'should not touch reflections from a public package', () => {
		expect( conversionResult.getChildByName( [ 'public-package/awesomeerror' ] ) ).to.not.equal( undefined );
	} );
} );
