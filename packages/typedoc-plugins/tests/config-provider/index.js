/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );
const { ParameterType } = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/config-provider', function() {
	this.timeout( 10 * 1000 );

	let typeDoc, files;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'config-provider', 'fixtures' );
	const TSCONFIG_PATH = utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );
	const PLUGINS = [
		require.resolve( '@ckeditor/typedoc-plugins/lib/config-provider' )
	];

	before( async () => {
		files = await glob( utils.normalizePath( FIXTURES_PATH, '**', '*.ts' ) );

		typeDoc = new TypeDoc.Application();
		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		typeDoc.bootstrap( {
			logLevel: 'Error',
			entryPoints: files,
			plugin: PLUGINS,
			tsconfig: TSCONFIG_PATH
		} );
	} );

	it( 'should define the `cwd` option', () => {
		const declaration = typeDoc.options.getDeclaration( 'cwd' );

		expect( declaration ).to.be.an( 'object' );
		expect( declaration ).to.have.property( 'type', ParameterType.String );
		expect( declaration ).to.have.property( 'help' );
	} );
} );
