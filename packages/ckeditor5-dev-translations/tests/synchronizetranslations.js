/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import getPackageContexts from '../lib/utils/getpackagecontexts.js';
import getSourceMessages from '../lib/utils/getsourcemessages.js';
import synchronizeTranslationsBasedOnContext from '../lib/utils/synchronizetranslationsbasedoncontext.js';
import synchronizeTranslations from '../lib/synchronizetranslations.js';

const stubs = vi.hoisted( () => {
	return {
		logger: {
			info: vi.fn(),
			error: vi.fn()
		}
	};
} );

vi.mock( '@ckeditor/ckeditor5-dev-utils', () => ( {
	logger: vi.fn( () => stubs.logger )
} ) );
vi.mock( '../lib/utils/getpackagecontexts.js' );
vi.mock( '../lib/utils/getsourcemessages.js' );
vi.mock( '../lib/utils/synchronizetranslationsbasedoncontext.js' );

describe( 'synchronizeTranslations()', () => {
	let defaultOptions;

	beforeEach( () => {
		defaultOptions = {
			sourceFiles: [
				'/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
				'/absolute/path/to/packages/ckeditor5-bar/src/utils/file.ts'
			],
			packagePaths: [
				'packages/ckeditor5-foo',
				'packages/ckeditor5-bar'
			],
			corePackagePath: 'packages/ckeditor5-core',
			ignoreUnusedCorePackageContexts: false,
			validateOnly: false,
			skipLicenseHeader: false
		};

		vi.mocked( getPackageContexts ).mockReturnValue( [] );
		vi.mocked( getSourceMessages ).mockReturnValue( [] );

		vi.spyOn( process, 'exit' ).mockImplementation( () => {} );
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/absolute/path/to' );
	} );

	it( 'should be a function', () => {
		expect( synchronizeTranslations ).toBeInstanceOf( Function );
	} );

	it( 'should load translations contexts', () => {
		synchronizeTranslations( defaultOptions );

		expect( getPackageContexts ).toHaveBeenCalledTimes( 1 );
		expect( getPackageContexts ).toHaveBeenCalledWith( {
			packagePaths: [
				'/absolute/path/to/packages/ckeditor5-foo',
				'/absolute/path/to/packages/ckeditor5-bar'
			],
			corePackagePath: '/absolute/path/to/packages/ckeditor5-core'
		} );

		expect( stubs.logger.info ).toHaveBeenCalledWith( '📍 Loading translations contexts...' );
	} );

	it( 'should resolve paths to packages using custom cwd', () => {
		defaultOptions.cwd = '/another/workspace';

		synchronizeTranslations( defaultOptions );

		expect( getPackageContexts ).toHaveBeenCalledTimes( 1 );
		expect( getPackageContexts ).toHaveBeenCalledWith( {
			packagePaths: [
				'/another/workspace/packages/ckeditor5-foo',
				'/another/workspace/packages/ckeditor5-bar'
			],
			corePackagePath: '/another/workspace/packages/ckeditor5-core'
		} );
	} );

	it( 'should load messages from source files', () => {
		synchronizeTranslations( defaultOptions );

		expect( getSourceMessages ).toHaveBeenCalledTimes( 1 );
		expect( getSourceMessages ).toHaveBeenCalledWith( {
			packagePaths: [
				'/absolute/path/to/packages/ckeditor5-foo',
				'/absolute/path/to/packages/ckeditor5-bar'
			],
			sourceFiles: [
				'/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts',
				'/absolute/path/to/packages/ckeditor5-bar/src/utils/file.ts'
			],
			onErrorCallback: expect.any( Function )
		} );

		expect( stubs.logger.info ).toHaveBeenCalledWith( '📍 Loading messages from source files...' );
	} );

	it( 'should collect errors when loading messages from source files failed', () => {
		vi.mocked( getSourceMessages ).mockImplementation( ( { onErrorCallback } ) => {
			onErrorCallback( 'Example error when loading messages from source files.' );

			return [];
		} );

		synchronizeTranslations( defaultOptions );

		expect( stubs.logger.error ).toHaveBeenCalledWith( '🔥 The following errors have been found:' );
		expect( stubs.logger.error ).toHaveBeenCalledWith( '   - Example error when loading messages from source files.' );
		expect( process.exit ).toHaveBeenCalledWith( 1 );
	} );

	it( 'should synchronize translations files', () => {
		synchronizeTranslations( defaultOptions );

		expect( synchronizeTranslationsBasedOnContext ).toHaveBeenCalledTimes( 1 );
		expect( synchronizeTranslationsBasedOnContext ).toHaveBeenCalledWith( {
			packageContexts: [],
			sourceMessages: [],
			skipLicenseHeader: false
		} );

		expect( stubs.logger.info ).toHaveBeenCalledWith( '📍 Synchronizing translations files...' );
	} );

	it( 'should synchronize translations files with skipping the license header', () => {
		defaultOptions.skipLicenseHeader = true;

		synchronizeTranslations( defaultOptions );

		expect( synchronizeTranslationsBasedOnContext ).toHaveBeenCalledTimes( 1 );
		expect( synchronizeTranslationsBasedOnContext ).toHaveBeenCalledWith( {
			packageContexts: [],
			sourceMessages: [],
			skipLicenseHeader: true
		} );

		expect( stubs.logger.info ).toHaveBeenCalledWith( '📍 Synchronizing translations files...' );
	} );

	it( 'should not synchronize translations files when validation mode is enabled', () => {
		defaultOptions.validateOnly = true;
		synchronizeTranslations( defaultOptions );

		expect( synchronizeTranslationsBasedOnContext ).not.toHaveBeenCalled();
		expect( stubs.logger.info ).toHaveBeenCalledWith( '✨ No errors found.' );
	} );

	describe( 'validation', () => {
		describe( 'missing context', () => {
			it( 'should return no error if there is no missing context (no context, no message)', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing context' ) );
			} );

			it( 'should return no error if there is no missing context (context in "foo", no message)', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing context' ) );
			} );

			it( 'should return no error if there is no missing context (context in "core", no message)', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing context' ) );
			} );

			it( 'should return no error if there is no missing context (context in "foo", message in "foo")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing context' ) );
			} );

			it( 'should return no error if there is no missing context (context in "core", message in "foo")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing context' ) );
			} );

			it( 'should return no error if there is no missing context (context in "core", message in "core")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						filePath: '/absolute/path/to/packages/ckeditor5-core/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing context' ) );
			} );

			it( 'should return no error if there is no missing context (context in "foo" and "core", messages in "foo")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id2: 'Example message 2.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					},
					{
						id: 'id2',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing context' ) );
			} );

			it( 'should return error if there is missing context (no context, message in "foo")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing context "id1" in "/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts".'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error if there is missing context (context in "foo", message in "bar")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-bar',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-bar',
						filePath: '/absolute/path/to/packages/ckeditor5-bar/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing context "id1" in "/absolute/path/to/packages/ckeditor5-bar/src/utils/file.ts".'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error if there is missing context (context in "foo", message in "core")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						filePath: '/absolute/path/to/packages/ckeditor5-core/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing context "id1" in "/absolute/path/to/packages/ckeditor5-core/src/utils/file.ts".'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );
		} );

		describe( 'all context used', () => {
			it( 'should return no error if all context is used (no context, no message)', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Unused context' ) );
			} );

			it( 'should return no error if all context is used (context in "foo", message in "foo")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Unused context' ) );
			} );

			it( 'should return no error if all context is used (context in "core", message in "foo")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Unused context' ) );
			} );

			it( 'should return no error if all context is used (context in "core", message in "core")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						filePath: '/absolute/path/to/packages/ckeditor5-core/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Unused context' ) );
			} );

			it( 'should return no error if all context is used (context in "foo" and "core", messages in "foo")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id2: 'Example message 2.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					},
					{
						id: 'id2',
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						filePath: '/absolute/path/to/packages/ckeditor5-foo/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Unused context' ) );
			} );

			it( 'should return no error if all context is used (context in "core", no message, ignore core)', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [] );

				defaultOptions.ignoreUnusedCorePackageContexts = true;

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Unused context' ) );
			} );

			it( 'should return error if there is unused context (context in "foo", no message)', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Unused context "id1" in "/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json".'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error if there is unused context (context in "foo", message in "bar")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-bar',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-bar',
						filePath: '/absolute/path/to/packages/ckeditor5-bar/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Unused context "id1" in "/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json".'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error if there is unused context (context in "foo", message in "core")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [
					{
						id: 'id1',
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						filePath: '/absolute/path/to/packages/ckeditor5-core/src/utils/file.ts'
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Unused context "id1" in "/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json".'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error if there is unused context (context in "core", no message)', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Unused context "id1" in "/absolute/path/to/packages/ckeditor5-core/lang/contexts.json".'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );
		} );

		describe( 'duplicated context', () => {
			it( 'should return no error if there is no duplicated context (no context)', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {}
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Duplicated context' ) );
			} );

			it( 'should return no error if there is no duplicated context (no context in "foo", context in "core")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Duplicated context' ) );
			} );

			it( 'should return no error if there is no duplicated context (context in "foo", another context in "core")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id2: 'Example message 2.'
						}
					}
				] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Duplicated context' ) );
			} );

			it( 'should return error if there is duplicated context (the same context in "foo" and "core")', () => {
				vi.mocked( getPackageContexts ).mockReturnValue( [
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-foo',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					},
					{
						packagePath: '/absolute/path/to/packages/ckeditor5-core',
						contextFilePath: '/absolute/path/to/packages/ckeditor5-core/lang/contexts.json',
						contextContent: {
							id1: 'Example message 1.'
						}
					}
				] );

				vi.mocked( getSourceMessages ).mockReturnValue( [] );

				synchronizeTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Duplicated context "id1" in ' +
					'"/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json", ' +
					'"/absolute/path/to/packages/ckeditor5-core/lang/contexts.json".'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );
		} );
	} );
} );
