/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver, { type ReleaseType } from 'semver';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { validateVersionAvailability } from './validateversionavailability.js';
import { validateVersionHigherThanCurrent } from './validateversionhigherthancurrent.js';
import { logInfo } from './loginfo.js';

const CLI_INDENT_SIZE = 3;

type Options = {
	packageName: string;
	version: string;
	bumpType: ReleaseType;
	indentLevel?: number;
	areChangesetsInvalid: boolean;
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
	type: 'input';
	name: 'continue';
	message: string;
	default: string;
	prefix: string;
};

/**
 * This function displays a prompt to provide a new version for all packages in the repository.
 * The version is being validated e.g. invalid version format or already used version are not accepted.
 */
export async function provideNewVersionForMonorepository( options: Options ): Promise<string> {
	if ( options.areChangesetsInvalid ) {
		// Display warning about invalid changes
		displayInvalidChangesWarning();

		// Ask for confirmation to continue
		const shouldContinue = await askContinueConfirmation( options.indentLevel );

		if ( !shouldContinue ) {
			process.exit( 0 );
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
	logInfo( chalk.yellow.bold( '⚠️  WARNING: Invalid changes detected!' ) );
	logInfo( chalk.yellow( 'You can cancel this process, fix the sources, and rerun the tool.' ) );
	logInfo( '' );
}

/**
 * Asks the user if they want to continue with the version bump process.
 */
async function askContinueConfirmation( indentLevel: number = 0 ): Promise<boolean> {
	const question: ConfirmationQuestion = {
		type: 'input',
		name: 'continue',
		message: 'Do you want to fix them? (Press Enter to cancel, or type anything to continue):',
		default: '',
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	};

	const answers = await inquirer.prompt<{ continue: string }>( question as any );

	// If user just pressed enter (empty response), they want to cancel
	return answers.continue.trim() !== '';
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

			const higherVersionValidation = validateVersionHigherThanCurrent( input, version );

			if ( higherVersionValidation !== true ) {
				return higherVersionValidation;
			}

			return validateVersionAvailability( input, packageName );
		},
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	} ];
}
