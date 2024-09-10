/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import executeInParallel from '../../lib/utils/executeinparallel.js';

const REPOSITORY_ROOT = path.join( __dirname, '..', '..', '..', '..' );

// This file covers the "parallelworker.js" file.

describe( 'dev-release-tools/utils', () => {
	let abortController;

	beforeEach( () => {
		abortController = new AbortController();
	} );

	describe( 'executeInParallel() - integration', () => {
		it( 'should store current time in all found packages', async () => {
			const timeBefore = new Date().getTime();

			await executeInParallel( {
				cwd: REPOSITORY_ROOT,
				concurrency: 2,
				packagesDirectory: 'packages',
				signal: abortController.signal,
				taskToExecute: async packagePath => {
					const fs = await import( 'fs/promises' );
					const path = await import( 'path' );
					const filePath = path.join( packagePath, 'executeinparallel-integration.log' );

					fs.writeFile( filePath, new Date().getTime().toString() );
				},
				listrTask: {
					output: ''
				}
			} );

			const timeAfter = new Date().getTime();

			const data = glob.sync( 'packages/*/executeinparallel-integration.log', { cwd: REPOSITORY_ROOT, absolute: true } )
				.map( logFile => {
					return {
						source: logFile,
						value: parseInt( fs.readFileSync( logFile, 'utf-8' ) ),
						packageName: logFile.split( '/' ).reverse().slice( 1, 2 ).pop()
					};
				} );

			for ( const { value, packageName, source } of data ) {
				expect( value > timeBefore, `comparing timeBefore (${ packageName })` ).toEqual( true );
				expect( value < timeAfter, `comparing timeAfter (${ packageName })` ).toEqual( true );

				fs.unlinkSync( source );
			}
		} );

		it( 'should pass task options to the worker', async () => {
			await executeInParallel( {
				cwd: REPOSITORY_ROOT,
				concurrency: 2,
				packagesDirectory: 'packages',
				signal: abortController.signal,
				taskToExecute: async ( packagePath, taskOptions ) => {
					const fs = await import( 'fs/promises' );
					const path = await import( 'path' );
					const filePath = path.join( packagePath, 'executeinparallel-integration.log' );

					await fs.writeFile( filePath, JSON.stringify( taskOptions ) );
				},
				taskOptions: {
					property: 'Example of the property.',
					some: {
						deeply: {
							nested: {
								property: 'Example the deeply nested property.'
							}
						}
					}
				},
				listrTask: {
					output: ''
				}
			} );

			const data = glob.sync( 'packages/*/executeinparallel-integration.log', { cwd: REPOSITORY_ROOT, absolute: true } )
				.map( logFile => {
					return {
						source: logFile,
						value: JSON.parse( fs.readFileSync( logFile, 'utf-8' ) ),
						packageName: logFile.split( '/' ).reverse().slice( 1, 2 ).pop()
					};
				} );

			for ( const { value, packageName, source } of data ) {
				expect( value, `comparing taskOptions (${ packageName })` ).toEqual( {
					property: 'Example of the property.',
					some: {
						deeply: {
							nested: {
								property: 'Example the deeply nested property.'
							}
						}
					}
				} );

				fs.unlinkSync( source );
			}
		} );
	} );
} );

