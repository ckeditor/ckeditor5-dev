/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import upath from 'upath';

/**
 * Interface representing the package.json content.
 */
interface PackageJson {
	name: string;
	version: string;
	[key: string]: unknown;
}

/**
 * Gets the package.json content from the specified directory.
 *
 * @param cwd - Current working directory (default: process.cwd())
 * @returns The package.json content
 * @throws {Error} If the package.json file doesn't exist or is invalid
 */
export async function getPackageJson( cwd = process.cwd() ): Promise<PackageJson> {
	const packageJsonPath = upath.join( cwd, 'package.json' );
	const content = await readPackageJsonFile( packageJsonPath );
	return parsePackageJson( content );
}

/**
 * Reads the package.json file from the specified path.
 *
 * @param path - Path to the package.json file
 * @returns The raw content of the package.json file
 * @throws {Error} If the file doesn't exist or can't be read
 */
async function readPackageJsonFile( path: string ): Promise<string> {
	try {
		return await fs.readFile( path, 'utf-8' );
	} catch ( error ) {
		throw new Error( `Could not read package.json file: ${ error instanceof Error ? error.message : String( error ) }` );
	}
}

/**
 * Parses the package.json content and validates required fields.
 *
 * @param content - The raw content of the package.json file
 * @returns The parsed package.json content
 * @throws {Error} If the content is invalid JSON or missing required fields
 */
function parsePackageJson( content: string ): PackageJson {
	try {
		const packageJson = JSON.parse( content ) as PackageJson;
		validatePackageJson( packageJson );
		return packageJson;
	} catch ( error ) {
		throw new Error( `Invalid package.json content: ${ error instanceof Error ? error.message : String( error ) }` );
	}
}

/**
 * Validates that the package.json has all required fields.
 *
 * @param packageJson - The parsed package.json content
 * @throws {Error} If required fields are missing
 */
function validatePackageJson( packageJson: PackageJson ): void {
	if ( !packageJson.name ) {
		throw new Error( 'package.json must contain a "name" field' );
	}
	if ( !packageJson.version ) {
		throw new Error( 'package.json must contain a "version" field' );
	}
}
