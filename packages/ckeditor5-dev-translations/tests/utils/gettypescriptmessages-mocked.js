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

		const fixturesPath = upath.join( import.meta.dirname, '..', 'fixtures', 'getsourcemessages' );
		const sourceFilePath = upath.join( fixturesPath, 'ckeditor5-method-calls', 'src', 'messages.ts' );
		const { default: getTypeScriptMessages } = await import( '../../lib/utils/gettypescriptmessages.js' );

		expect( getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ sourceFilePath ],
			onErrorCallback: () => {}
		} ) ).to.equal( null );
	} );

	it( 'should return null when the resolved ckeditor5-utils module is not part of the program', async () => {
		vi.doMock( 'typescript', async importOriginal => {
			const actualModule = await importOriginal();
			const actualTypeScript = actualModule.default || actualModule;

			return {
				...actualModule,
				default: {
					...actualTypeScript,
					resolveModuleName: () => ( {
						resolvedModule: {
							resolvedFileName: '/path/to/missing-ckeditor5-utils.d.ts'
						}
					} )
				}
			};
		} );

		const fixturesPath = upath.join( import.meta.dirname, '..', 'fixtures', 'getsourcemessages' );
		const sourceFilePath = upath.join( fixturesPath, 'ckeditor5-method-calls', 'src', 'messages.ts' );
		const { default: getTypeScriptMessages } = await import( '../../lib/utils/gettypescriptmessages.js' );

		expect( getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ sourceFilePath ],
			onErrorCallback: () => {}
		} ) ).to.equal( null );
	} );

	it( 'should return null when the TypeScript config cannot be read', async () => {
		vi.doMock( 'typescript', async importOriginal => {
			const actualModule = await importOriginal();
			const actualTypeScript = actualModule.default || actualModule;

			return {
				...actualModule,
				default: {
					...actualTypeScript,
					readConfigFile: () => ( { config: undefined, error: {} } )
				}
			};
		} );

		const fixturesPath = upath.join( import.meta.dirname, '..', 'fixtures', 'getsourcemessages' );
		const sourceFilePath = upath.join( fixturesPath, 'ckeditor5-method-calls', 'src', 'messages.ts' );
		const { default: getTypeScriptMessages } = await import( '../../lib/utils/gettypescriptmessages.js' );

		expect( getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ sourceFilePath ],
			onErrorCallback: () => {}
		} ) ).to.equal( null );
	} );

	it( 'should ignore translation methods whose type cannot be determined', async () => {
		vi.doMock( 'typescript', async importOriginal => {
			const actualModule = await importOriginal();
			const actualTypeScript = actualModule.default || actualModule;

			return {
				...actualModule,
				default: {
					...actualTypeScript,
					createProgram: ( ...args ) => {
						const program = actualTypeScript.createProgram( ...args );
						const checker = program.getTypeChecker();
						const checkerProxy = new Proxy( checker, {
							get( target, property ) {
								if ( property === 'getTypeAtLocation' ) {
									return () => undefined;
								}

								const value = Reflect.get( target, property, target );

								return typeof value === 'function' ? value.bind( target ) : value;
							}
						} );

						return new Proxy( program, {
							get( target, property ) {
								if ( property === 'getTypeChecker' ) {
									return () => checkerProxy;
								}

								const value = Reflect.get( target, property, target );

								return typeof value === 'function' ? value.bind( target ) : value;
							}
						} );
					}
				}
			};
		} );

		const fixturesPath = upath.join( import.meta.dirname, '..', 'fixtures', 'getsourcemessages' );
		const sourceFilePath = upath.join( fixturesPath, 'ckeditor5-method-calls', 'src', 'messages.ts' );
		const { default: getTypeScriptMessages } = await import( '../../lib/utils/gettypescriptmessages.js' );

		expect( getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ sourceFilePath ],
			onErrorCallback: () => {}
		} ) ).toEqual( new Map( [ [ sourceFilePath, [
			{ id: 'Direct t alias translation', string: 'Direct t alias translation', plural: 'Direct t alias translations' }
		] ] ] ) );
	} );
} );
