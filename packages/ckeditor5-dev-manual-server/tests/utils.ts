/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { getOptimizedPackageIncludes } from '../src/utils.js';

describe( 'getOptimizedPackageIncludes()', () => {
	let temporaryDirectory: string;

	beforeEach( async () => {
		temporaryDirectory = await mkdtemp( join( tmpdir(), 'ckeditor5-optimized-package-includes-' ) );
	} );

	afterEach( async () => {
		await rm( temporaryDirectory, { recursive: true, force: true } );
	} );

	test( 'returns sorted unique package names', async () => {
		await Promise.all( [
			createPackageJson( 'alpha', { name: '@ckeditor/ckeditor5-zeta' } ),
			createPackageJson( 'bravo', { name: '@ckeditor/ckeditor5-alpha' } ),
			createPackageJson( 'charlie', { name: '@ckeditor/ckeditor5-zeta' } )
		] );

		expect( getOptimizedPackageIncludes( [ join( temporaryDirectory, '*.json' ) ] ) ).to.deep.equal( [
			'@ckeditor/ckeditor5-alpha',
			'@ckeditor/ckeditor5-zeta'
		] );
	} );

	test( 'uses all provided globs', async () => {
		await Promise.all( [
			createPackageJson( 'alpha', { name: '@ckeditor/ckeditor5-alpha' } ),
			createPackageJson( 'bravo', { name: '@ckeditor/ckeditor5-bravo' } ),
			createPackageJson( 'charlie', { name: '@ckeditor/ckeditor5-charlie' } )
		] );

		expect( getOptimizedPackageIncludes( [
			join( temporaryDirectory, 'alpha.json' ),
			join( temporaryDirectory, 'bravo.json' )
		] ) ).to.deep.equal( [
			'@ckeditor/ckeditor5-alpha',
			'@ckeditor/ckeditor5-bravo'
		] );
	} );

	function createPackageJson( directoryName: string, packageJson: Record<string, unknown> ): Promise<string> {
		const packageJsonPath = join( temporaryDirectory, `${ directoryName }.json` );

		return writeFile( packageJsonPath, JSON.stringify( packageJson ) )
			.then( () => packageJsonPath );
	}
} );
