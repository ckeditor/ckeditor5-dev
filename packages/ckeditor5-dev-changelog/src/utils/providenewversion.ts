/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver, { type ReleaseType } from 'semver';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { checkVersionAvailability } from './checkversionavailability.js';
import { isVersionGreaterThanCurrent } from './isversiongreaterthancurrent.js';
import { logInfo } from './loginfo.js';
import { UserAbortError } from './useraborterror.js';

const CLI_INDENT_SIZE = 3;

type Options = {
	packageName: string;
	version: string;
	bumpType: ReleaseType;
	indentLevel?: number;
	displayValidationWarning: boolean;
};

type VersionValidationResult = string | true;

type Question = {
	type: 'input';
	name: 'version';
	default: string;
	message: string;
	filter: ( input: string ) => string;
	validate: ( input: string ) => Promise<VersionValidationResult>;
	prefix: string;
};

type ConfirmationQuestion = {
	type: 'confirm';
	name: 'continue';
	message: string;
	default: boolean;
	prefix: string;
};

/**
 * Prompts the user to provide a new version for a package.
 *
 * Validates the input (version format, version higher than current, availability).
 *
 * Optionally shows warnings for invalid changes and allows user to abort.
 */
export async function provideNewVersion( options: Options ): Promise<string> {
	if ( options.displayValidationWarning ) {
		// Display warning about invalid changes
		displayInvalidChangesWarning();

		// Ask for confirmation to continue
		const shouldContinue = await askContinueConfirmation( options.indentLevel );

		if ( !shouldContinue ) {
			throw new UserAbortError( 'Aborted while detecting invalid changes.' );
		}
	}

	const question = createVersionQuestion( options );
	const answers = await inquirer.prompt<{ version: string }>( question as any );

	return answers.version;
}

/**
 * Displays a warning message about invalid changes in a visible color.
 */
function displayInvalidChangesWarning(): void {
	logInfo( '' );
	logInfo( chalk.yellow( chalk.bold( `⚠️  ${ chalk.underline( 'WARNING: Invalid changes detected!' ) }` ) ) );
	logInfo( '' );
	logInfo( chalk.yellow( 'You can cancel the process, fix the invalid files, and run the tool again.' ) );
	logInfo( chalk.yellow( 'Alternatively, you can continue - but invalid values will be lost.' ) );
	logInfo( '' );
}

/**
 * Asks the user if they want to continue with the version bump process.
 */
async function askContinueConfirmation( indentLevel: number = 0 ): Promise<boolean> {
	const question: ConfirmationQuestion = {
		type: 'confirm',
		name: 'continue',
		message: 'Do you want to fix them?',
		default: false,
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	};

	const answers = await inquirer.prompt<{ continue: boolean }>( question as any );

	return answers.continue;
}

/**
 * Validates if the provided version is valid according to semver.
 */
function validateVersionFormat( version: string ): VersionValidationResult {
	// Allow 'internal' as a special version
	if ( version === 'internal' ) {
		return true;
	}

	if ( !semver.valid( version ) ) {
		return 'Please provide a valid version or "internal" for internal changes.';
	}

	return true;
}

/**
 * Creates a prompt question for version input with validation.
 */
function createVersionQuestion( options: Options ): Array<Question> {
	const { version, packageName, bumpType, indentLevel = 0 } = options;
	const suggestedVersion = semver.inc( version, bumpType ) || version;
	const message = 'Type the new version ' +
		`(current: "${ version }", suggested: "${ suggestedVersion }", or "internal" for internal changes):`;

	return [ {
		type: 'input',
		name: 'version',
		default: suggestedVersion,
		message,
		filter: ( input: string ) => input.trim(),
		async validate( input: string ): Promise<VersionValidationResult> {
			const formatValidation = validateVersionFormat( input );

			if ( formatValidation !== true ) {
				return formatValidation;
			}

			// For 'internal', skip further validation
			if ( input === 'internal' ) {
				return true;
			}

			const higherVersionValidation = isVersionGreaterThanCurrent( input, version );

			if ( higherVersionValidation !== true ) {
				return higherVersionValidation;
			}

			return checkVersionAvailability( input, packageName );
		},
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	} ];
}
