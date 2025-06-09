/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { mkdir, copyFile, constants } from 'fs/promises';
import { promisify, styleText, parseArgs } from 'util';
import { exec } from 'child_process';
import path from 'upath';
import { format } from 'date-fns';
import { CHANGESET_DIRECTORY, TEMPLATE_FILE } from './utils/constants.js';

/**
 * Options for the `generateTemplate` function.
 */
interface GenerateTemplateOptions {
	directory: string;
}

/**
 * Default options for the `generateTemplate` function.
 */
const DEFAULT_OPTIONS: GenerateTemplateOptions = {
	directory: CHANGESET_DIRECTORY
};

/**
 * Reads CLI arguments and turn the keys into camelcase.
 */
function getCliArguments(): Partial<GenerateTemplateOptions> {
	const { values } = parseArgs( {
		options: {
			directory: { type: 'string' }
		},

		// Skip `node ckeditor5-dev-changelog`.
		args: process.argv.slice( 2 ),

		// Fail when unknown argument is used.
		strict: true
	} );

	return values;
}

/**
 * Returns normalized options object for the `generateTemplate` function.
 */
function normalizeOptions( options: Partial<GenerateTemplateOptions> ): GenerateTemplateOptions {
	const normalized: GenerateTemplateOptions = Object.assign( {}, DEFAULT_OPTIONS, options );

	// Ensure that paths are absolute and resolve to the current working directory.
	normalized.directory = path.resolve( process.cwd(), normalized.directory );

	return normalized;
}

/**
 * Returns the current git branch name formatted to be used in a filename.
 */
async function getFormattedGitBranchName(): Promise<string> {
	try {
		const asyncExec = promisify( exec );
		const { stdout } = await asyncExec( 'git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' } );

		return stdout
			.trim()
			.replace( /[^a-zA-Z0-9]/g, '_' );
	} catch {
		console.error( styleText( [ 'red', 'bold' ], 'Error: Git is not installed or the current folder is not in git repository.' ) );
		process.exit( 1 );
	}
}

/**
 * Returns a filename for the template file based on the current date and git branch name.
 * The filename is formatted as `YYYYMMDDHHMMSS_{GIT_BRANCH_NAME}.md`.
 */
export async function getFileName(): Promise<string> {
	const date = format( new Date(), 'yyyyMMddHHmmss' );
	const gitBranchName = await getFormattedGitBranchName();

	return `${ date }_${ gitBranchName }.md`;
}

/**
 * Generates a template file for the changelog in the specified directory.
 */
export async function generateTemplate(
	args: Partial<GenerateTemplateOptions> = getCliArguments(),
	retries = 5
): Promise<void> {
	const options: GenerateTemplateOptions = normalizeOptions( args );
	const filename = await getFileName();
	const outputPath = path.resolve( options.directory, filename );

	await mkdir( options.directory, { recursive: true } );

	try {
		await copyFile( TEMPLATE_FILE, outputPath, constants.COPYFILE_EXCL );

		const indent = ' '.repeat( 3 );
		const relativePath = path.relative( process.cwd(), outputPath );

		console.log( styleText( 'green', '✅ The changelog file has been successfully created.' ) );
		console.log( '' );
		console.log( '✍️ Please fill in with relevant information about your changes.' );
		console.log( indent + styleText( 'cyan', `file://${ outputPath }` ) );
		console.log( '' );
		console.log( '📥 Once done, commit the changelog file:' );

		console.log( indent + styleText( 'gray', `$ git add ${ relativePath }` ) );
		console.log( indent + styleText( 'gray', '$ git commit -m "..."' ) );
	} catch ( error: any ) {
		if ( retries <= 0 ) {
			console.error( styleText( [ 'red', 'bold' ], 'Error: Generating changelog file failed with the following error:' ) );
			throw error;
		}

		console.error( styleText( 'gray', 'You are going to fast 🥵 Waiting 1 second to ensure unique changelog name.' ) );

		return new Promise( resolve => {
			setTimeout( () => {
				resolve( generateTemplate( options, retries - 1 ) );
			}, 1000 );
		} );
	}
}
