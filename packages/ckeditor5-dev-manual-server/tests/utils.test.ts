/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { getOptimizedPackageIncludes, stringifyValues, toPublicFilePath, toPublicSpecifier } from '../src/utils.js';
import { createTemporaryDirectory, removeDirectory } from './_utils/files.js';

describe( 'getOptimizedPackageIncludes()', () => {
	let temporaryDirectory: string;

	beforeEach( async () => {
		temporaryDirectory = await createTemporaryDirectory( 'ckeditor5-optimized-package-includes-' );
	} );

	afterEach( async () => {
		await removeDirectory( temporaryDirectory );
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

describe( 'stringifyValues()', () => {
	test( 'JSON-stringifies object values', () => {
		expect( stringifyValues( {
			array: [ 'foo' ],
			boolean: true,
			number: 5,
			string: 'bar'
		} ) ).to.deep.equal( {
			array: '["foo"]',
			boolean: 'true',
			number: '5',
			string: '"bar"'
		} );
	} );
} );

describe( 'public path utilities', () => {
	test( 'returns a public path for files inside the workspace', () => {
		expect( toPublicFilePath( '/workspace/packages/foo/manual.html', '/workspace' ) )
			.to.equal( '/packages/foo/manual.html' );
	} );

	test( 'returns a Vite file-system path for files outside the workspace', () => {
		expect( toPublicFilePath( '/external/theme/shell.ts', '/workspace' ) )
			.to.equal( '/@fs//external/theme/shell.ts' );
	} );

	test( 'normalizes public specifiers', () => {
		expect( toPublicSpecifier( '\\packages\\foo\\manual.html' ) ).to.equal( '/packages/foo/manual.html' );
	} );
} );
