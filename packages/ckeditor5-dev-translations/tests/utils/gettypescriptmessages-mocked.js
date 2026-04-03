/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import upath from 'upath';

describe( 'getTypeScriptMessages() module resolution failures', () => {
	afterEach( () => {
		vi.resetModules();
		vi.doUnmock( 'typescript' );
	} );

	it( 'should return null when the ckeditor5-utils module cannot be resolved', async () => {
		vi.doMock( 'typescript', async importOriginal => {
			const actualModule = await importOriginal();
			const actualTypeScript = actualModule.default || actualModule;

			return {
				...actualModule,
				default: {
					...actualTypeScript,
					resolveModuleName: () => ( { resolvedModule: undefined } )
				}
			};
		} );

		const fixturesPath = upath.join( import.meta.dirname, '..', '_fixtures', 'getsourcemessages' );
		const sourceFilePath = upath.join( fixturesPath, 'ckeditor5-method-calls', 'src', 'messages.ts' );
		const { default: getTypeScriptMessages } = await import( '../../lib/utils/gettypescriptmessages.js' );

		expect( getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ sourceFilePath ],
			onErrorCallback: () => {}
		} ) ).to.equal( null );
	} );
} );
