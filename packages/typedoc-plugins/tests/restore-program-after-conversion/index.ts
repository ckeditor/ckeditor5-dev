/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import { Application, Converter, type Context } from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocRestoreProgramAfterConversion } from '../../src/index.js';
import { getPluginPriority } from '../../src/utils/getpluginpriority.js';

function contextProgramChecker( app: Application ) {
	app.converter.on( Converter.EVENT_END, ( context: Context ) => {
		expect( context.program ).not.toBeUndefined();
	}, getPluginPriority( 'contextProgramChecker' ) );
}

describe( 'typedoc-plugins/restore-program-after-conversion', () => {
	it( 'should not throw an error when accessing the `context.program` after the conversion is finished', async () => {
		const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'restore-program-after-conversion', 'fixtures' );
		const sourceFilePatterns = [ upath.join( fixturesPath, '**', '*.ts' ) ];

		const entryPoints = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );

		expect( entryPoints ).to.not.lengthOf( 0 );

		const app = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints,
			tsconfig: upath.join( fixturesPath, 'tsconfig.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			]
		} );

		// The order of loaded plugins is explicitly set to make sure that it does not matter: first, the test plugin is executed
		// that reads `context.program` before the plugin that fixes TypeDoc behavior.
		contextProgramChecker( app );
		typeDocRestoreProgramAfterConversion( app );

		await expect( app.convert() ).resolves.not.toBeUndefined();
	} );
} );
