/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { mkdir, copyFile, constants } from 'fs/promises';
import { promisify, styleText, parseArgs } from 'util';
import { exec } from 'child_process';
import { isAbsolute, resolve, relative } from 'path';
import { CHANGESET_DIRECTORY, TEMPLATE_FILE } from './constants.js';

/**
 * Options for the `generateTemplate` function.
 */
interface GenerateTemplateOptions {
	cwd: string;
	directory: string;
	template: string;
	retries: number;
}

/**
 * Default options for the `generateTemplate` function.
 */
const DEFAULT_OPTIONS: GenerateTemplateOptions = {
	cwd: process.cwd(),
	directory: CHANGESET_DIRECTORY,
	template: TEMPLATE_FILE,
	retries: 1
};

/**
 * Reads CLI arguments and turn the keys into camelcase.
 */
function getCliArguments(): Partial<GenerateTemplateOptions> {
	const { values } = parseArgs( {
		options: {
			cwd: { type: 'string' },
			directory: { type: 'string' },
			template: { type: 'string' },
			retries: { type: 'string' }
		},

		// Skip `node ckeditor5-dev-changelog`.
		args: process.argv.slice( 2 ),

		// Fail when unknown argument is used.
		strict: true
	} );

	return {
		...values,
		retries: Number( values.retries || DEFAULT_OPTIONS.retries )
	};
}

/**
 * Returns normalized options object for the `generateTemplate` function.
 */
function normalizeOptions( options: Partial<GenerateTemplateOptions> ): GenerateTemplateOptions {
	const normalized: GenerateTemplateOptions = Object.assign( {}, DEFAULT_OPTIONS, options );

	// Normalize all paths to be absolute.
	normalized.cwd = isAbsolute( normalized.cwd ) ? normalized.cwd : resolve( process.cwd(), normalized.cwd );
	normalized.directory = isAbsolute( normalized.directory ) ? normalized.directory : resolve( normalized.cwd, normalized.directory );
	normalized.template = isAbsolute( normalized.template ) ? normalized.template : resolve( normalized.cwd, normalized.template );

	return normalized;
}

/**
 * Returns the current date formatted to be used in a filename.
 */
function getFormattedDate(): string {
	const now = new Date();
	const year: string = String( now.getFullYear() );
	const month: string = String( now.getMonth() + 1 ).padStart( 2, '0' ); // Months are 0-indexed.
	const day: string = String( now.getDate() ).padStart( 2, '0' );
	const hours: string = String( now.getHours() ).padStart( 2, '0' );
	const minutes: string = String( now.getMinutes() ).padStart( 2, '0' );
	const seconds: string = String( now.getSeconds() ).padStart( 2, '0' );

	return year + month + day + hours + minutes + seconds;
}

/**
 * Returns the current git branch name formatted to be used in a filename.
 */
async function getFormattedGitBranchName( cwd: string ): Promise<string> {
	try {
		const asyncExec = promisify( exec );
		const { stdout } = await asyncExec( 'git rev-parse --abbrev-ref HEAD', {
			cwd,
			encoding: 'utf8'
		} );

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
export async function getFileName( cwd: string ): Promise<string> {
	const date = getFormattedDate();
	const gitBranchName = await getFormattedGitBranchName( cwd );

	return `${ date }_${ gitBranchName }.md`;
}

/**
 * Generates a template file for the changelog in the specified directory.
 */
export async function generateTemplate(
	options: Partial<GenerateTemplateOptions> = getCliArguments()
): Promise<void> {
	const args: GenerateTemplateOptions = normalizeOptions( options );
	const filename = await getFileName( args.cwd );
	const path = resolve( args.directory, filename );

	await mkdir( args.directory, { recursive: true } );

	try {
		await copyFile( args.template, path, constants.COPYFILE_EXCL );

		console.log( styleText( [ 'green', 'bold' ], `Changelog file created: ${ relative( args.cwd, path ) }` ) );
	} catch ( error: any ) {
		if ( args.retries <= 0 ) {
			throw error;
		}

		console.error( styleText( 'gray', 'You are going to fast 🥵 Waiting 1 second to ensure unique changelog name.' ) );

		return new Promise( resolve => {
			setTimeout( () => {
				resolve( generateTemplate( { ...args, retries: args.retries - 1 } ) );
			}, 1000 );
		} );
	}
}
