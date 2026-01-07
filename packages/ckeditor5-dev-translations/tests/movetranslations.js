/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import getPackageContext from '../lib/utils/getpackagecontext.js';
import moveTranslationsBetweenPackages from '../lib/utils/movetranslationsbetweenpackages.js';
import moveTranslations from '../lib/movetranslations.js';

const stubs = vi.hoisted( () => {
	return {
		logger: {
			info: vi.fn(),
			error: vi.fn()
		}
	};
} );

vi.mock( 'fs' );
vi.mock( '@ckeditor/ckeditor5-dev-utils', () => ( {
	logger: vi.fn( () => stubs.logger )
} ) );
vi.mock( '../lib/utils/getpackagecontext.js' );
vi.mock( '../lib/utils/movetranslationsbetweenpackages.js' );

describe( 'moveTranslations()', () => {
	let defaultOptions;

	beforeEach( () => {
		defaultOptions = {
			config: [
				{
					source: 'packages/ckeditor5-foo',
					destination: 'packages/ckeditor5-bar',
					messageId: 'id1'
				}
			]
		};

		vi.mocked( fs.existsSync ).mockReturnValue( true );

		vi.mocked( getPackageContext ).mockImplementation( ( { packagePath } ) => {
			const contextContent = {};

			if ( packagePath === '/absolute/path/to/packages/ckeditor5-foo' ) {
				contextContent.id1 = 'Context for message id1 from "ckeditor5-foo".';
			}

			if ( packagePath === '/absolute/path/to/packages/ckeditor5-bar' ) {
				contextContent.id2 = 'Context for message id2 from "ckeditor5-bar".';
			}

			return {
				contextContent,
				contextFilePath: packagePath + '/lang/contexts.json',
				packagePath
			};
		} );

		vi.spyOn( process, 'exit' ).mockImplementation( () => {} );
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/absolute/path/to' );
	} );

	it( 'should be a function', () => {
		expect( moveTranslations ).toBeInstanceOf( Function );
	} );

	it( 'should load translations contexts', () => {
		moveTranslations( defaultOptions );

		expect( getPackageContext ).toHaveBeenCalledTimes( 2 );
		expect( getPackageContext ).toHaveBeenCalledWith( { packagePath: '/absolute/path/to/packages/ckeditor5-foo' } );
		expect( getPackageContext ).toHaveBeenCalledWith( { packagePath: '/absolute/path/to/packages/ckeditor5-bar' } );

		expect( stubs.logger.info ).toHaveBeenCalledWith( '📍 Loading translations contexts...' );
	} );

	it( 'should resolve paths to packages using custom cwd', () => {
		defaultOptions.cwd = '/another/workspace';

		moveTranslations( defaultOptions );

		expect( getPackageContext ).toHaveBeenCalledTimes( 2 );
		expect( getPackageContext ).toHaveBeenCalledWith( { packagePath: '/another/workspace/packages/ckeditor5-foo' } );
		expect( getPackageContext ).toHaveBeenCalledWith( { packagePath: '/another/workspace/packages/ckeditor5-bar' } );
	} );

	it( 'should move translations between packages', () => {
		moveTranslations( defaultOptions );

		expect( moveTranslationsBetweenPackages ).toHaveBeenCalledTimes( 1 );
		expect( moveTranslationsBetweenPackages ).toHaveBeenCalledWith( {
			packageContexts: [
				{
					contextContent: {
						id1: 'Context for message id1 from "ckeditor5-foo".'
					},
					contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
					packagePath: '/absolute/path/to/packages/ckeditor5-foo'
				},
				{
					contextContent: {
						id2: 'Context for message id2 from "ckeditor5-bar".'
					},
					contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
					packagePath: '/absolute/path/to/packages/ckeditor5-bar'
				}
			],
			config: [
				{
					source: '/absolute/path/to/packages/ckeditor5-foo',
					destination: '/absolute/path/to/packages/ckeditor5-bar',
					messageId: 'id1'
				}
			]
		} );

		expect( stubs.logger.info ).toHaveBeenCalledWith( '📍 Moving translations between packages...' );
	} );

	describe( 'validation', () => {
		describe( 'unique move entries', () => {
			it( 'should return no error if there are unique entries (one entry, no duplicates)', () => {
				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Duplicated entry' ) );
			} );

			it( 'should return no error if there are unique entries (many entries, no duplicates)', () => {
				defaultOptions = {
					config: [
						{
							source: 'packages/ckeditor5-foo',
							destination: 'packages/ckeditor5-bar',
							messageId: 'id1'
						},
						{
							source: 'packages/ckeditor5-bar',
							destination: 'packages/ckeditor5-foo',
							messageId: 'id2'
						}
					]
				};

				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Duplicated entry' ) );
			} );

			it( 'should return error if there are duplicated entries (many entries, one duplicated entry)', () => {
				defaultOptions = {
					config: [
						{
							source: 'packages/ckeditor5-foo',
							destination: 'packages/ckeditor5-bar',
							messageId: 'id1'
						},
						{
							source: 'packages/ckeditor5-foo',
							destination: 'packages/ckeditor5-bar',
							messageId: 'id1'
						}
					]
				};

				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Duplicated entry: the "id1" message is configured to be moved multiple times.'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error once for each duplicated entry (many entries, many repeated duplicated entries)', () => {
				defaultOptions = {
					config: [
						{
							source: 'packages/ckeditor5-foo',
							destination: 'packages/ckeditor5-bar',
							messageId: 'id1'
						},
						{
							source: 'packages/ckeditor5-foo',
							destination: 'packages/ckeditor5-bar',
							messageId: 'id1'
						},
						{
							source: 'packages/ckeditor5-foo',
							destination: 'packages/ckeditor5-bar',
							messageId: 'id1'
						}
					]
				};

				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Duplicated entry: the "id1" message is configured to be moved multiple times.'
				);

				const callsWithDuplicatedEntryLog = stubs.logger.error.mock.calls.filter( call => {
					const [ arg ] = call;

					return arg.includes( 'Duplicated entry' );
				} );

				expect( callsWithDuplicatedEntryLog.length ).toEqual( 1 );

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );
		} );

		describe( 'packages exist', () => {
			it( 'should return no error if there is no missing package', () => {
				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing package' ) );
			} );

			it( 'should return error if there is missing package (missing source package)', () => {
				vi.mocked( fs.existsSync ).mockImplementation( path => {
					return path !== '/absolute/path/to/packages/ckeditor5-foo';
				} );

				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing package: the "/absolute/path/to/packages/ckeditor5-foo" package does not exist.'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error if there is missing package (missing destination package)', () => {
				vi.mocked( fs.existsSync ).mockImplementation( path => {
					return path !== '/absolute/path/to/packages/ckeditor5-bar';
				} );

				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing package: the "/absolute/path/to/packages/ckeditor5-bar" package does not exist.'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error if there is missing package (missing source and destination packages)', () => {
				vi.mocked( fs.existsSync ).mockReturnValue( false );

				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing package: the "/absolute/path/to/packages/ckeditor5-foo" package does not exist.'
				);

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing package: the "/absolute/path/to/packages/ckeditor5-bar" package does not exist.'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );
		} );

		describe( 'context exists', () => {
			it( 'should return no error if there is no missing context', () => {
				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).not.toHaveBeenCalledWith( expect.stringContaining( 'Missing context' ) );
			} );

			it( 'should return error if there is missing context (message id does not exist)', () => {
				defaultOptions.config = [
					{
						source: 'packages/ckeditor5-foo',
						destination: 'packages/ckeditor5-bar',
						messageId: 'id100'
					}
				];

				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing context: the "id100" message does not exist in "/absolute/path/to/packages/ckeditor5-foo" package.'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );

			it( 'should return error if there is missing context (message id exists only in destination package)', () => {
				defaultOptions.config = [
					{
						source: 'packages/ckeditor5-foo',
						destination: 'packages/ckeditor5-bar',
						messageId: 'id2'
					}
				];

				moveTranslations( defaultOptions );

				expect( stubs.logger.error ).toHaveBeenCalledWith(
					'   - Missing context: the "id2" message does not exist in "/absolute/path/to/packages/ckeditor5-foo" package.'
				);

				expect( process.exit ).toHaveBeenCalledWith( 1 );
			} );
		} );
	} );
} );
