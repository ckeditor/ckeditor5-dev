/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import upath from 'upath';
import type { ParsedFile } from '../types.js';

/**
 * Parses multiple changeset files and returns their combined content.
 *
 * @param changesetFilePaths - Array of paths to changeset files
 * @returns Array of parsed changeset files
 * @throws {Error} If there's an error reading or parsing any of the files
 */
export async function getChangesetsParsed( changesetFilePaths: Array<string> ): Promise<Array<ParsedFile>> {
	const parsedFiles = await Promise.all(
		changesetFilePaths.map( filePath => parseChangesetFile( filePath ) )
	);
	return parsedFiles.filter( ( file ): file is ParsedFile => file !== null );
}

/**
 * Parses a single changeset file.
 *
 * @param filePath - Path to the changeset file
 * @returns The parsed changeset file content or null if the file doesn't exist
 * @throws {Error} If there's an error reading or parsing the file
 */
async function parseChangesetFile( filePath: string ): Promise<ParsedFile | null> {
	try {
		const content = await readChangesetFile( filePath );
		return parseChangesetContent( content, filePath );
	} catch ( error ) {
		if ( error instanceof Error && error.message.includes( 'ENOENT' ) ) {
			return null;
		}
		throw error;
	}
}

/**
 * Reads the content of a changeset file.
 *
 * @param filePath - Path to the changeset file
 * @returns The raw content of the file
 * @throws {Error} If there's an error reading the file
 */
async function readChangesetFile( filePath: string ): Promise<string> {
	try {
		return await fs.readFile( filePath, 'utf-8' );
	} catch ( error ) {
		throw new Error( `Could not read changeset file ${ filePath }: ${ error instanceof Error ? error.message : String( error ) }` );
	}
}

/**
 * Parses the content of a changeset file.
 *
 * @param content - The raw content of the changeset file
 * @param filePath - Path to the changeset file
 * @returns The parsed changeset file content
 * @throws {Error} If the content is invalid
 */
function parseChangesetContent( content: string, filePath: string ): ParsedFile {
	try {
		const parsedContent = JSON.parse( content );
		validateChangesetContent( parsedContent );
		return {
			...parsedContent,
			filePath
		};
	} catch ( error ) {
		throw new Error( `Invalid changeset file ${ filePath }: ${ error instanceof Error ? error.message : String( error ) }` );
	}
}

/**
 * Validates the structure of a parsed changeset file.
 *
 * @param content - The parsed content to validate
 * @throws {Error} If the content is missing required fields or has invalid structure
 */
function validateChangesetContent( content: unknown ): void {
	if ( !content || typeof content !== 'object' ) {
		throw new Error( 'Changeset content must be an object' );
	}

	const { id, summary, releases } = content as Record<string, unknown>;

	if ( !id || typeof id !== 'string' ) {
		throw new Error( 'Changeset must contain a valid "id" field' );
	}

	if ( !summary || typeof summary !== 'string' ) {
		throw new Error( 'Changeset must contain a valid "summary" field' );
	}

	if ( !releases || typeof releases !== 'object' ) {
		throw new Error( 'Changeset must contain a valid "releases" field' );
	}

	// Validate each release entry
	Object.entries( releases as Record<string, unknown> ).forEach( ( [ packageName, release ] ) => {
		if ( !release || typeof release !== 'object' ) {
			throw new Error( `Invalid release for package "${ packageName }"` );
		}

		const { type } = release as Record<string, unknown>;
		if ( !type || typeof type !== 'string' ) {
			throw new Error( `Release for package "${ packageName }" must contain a valid "type" field` );
		}
	} );
}
