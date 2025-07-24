/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver, { type ReleaseType } from 'semver';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { logInfo } from './loginfo.js';
import { UserAbortError } from './useraborterror.js';
import type { ChangelogReleaseType, ReleaseChannel } from '../types.js';
import { validateInputVersion } from './validateinputversion.js';

const CLI_INDENT_SIZE = 3;

type Options = {
	packageName: string;
	version: string;
	bumpType: ReleaseType;
	releaseChannel: ReleaseChannel;
	indentLevel?: number;
	displayValidationWarning: boolean;
	releaseType: ChangelogReleaseType;
};

type Question = {
	type: 'input';
	name: 'version';
	default: string;
	message: string;
	filter: ( input: string ) => string;
	validate: ( input: string ) => Promise<string | true>;
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
		message: 'Should continue?',
		default: false,
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	};

	const answers = await inquirer.prompt<{ continue: boolean }>( question as any );

	return answers.continue;
}

/**
 * Creates a prompt question for version input with validation.
 */
function createVersionQuestion( options: Options ): Array<Question> {
	const { version, packageName, bumpType, releaseChannel, releaseType, indentLevel = 0 } = options;
	const suggestedVersion = getSuggestedVersion( bumpType, version, releaseChannel ) || version;
	const message = 'Type the new version ' +
		`(current: "${ version }", suggested: "${ suggestedVersion }", or "internal" for internal changes):`;

	return [ {
		type: 'input',
		name: 'version',
		default: suggestedVersion,
		message,
		filter: ( newVersion: string ) => newVersion.trim(),
		validate: ( newVersion: string ) => validateInputVersion( { newVersion, version, releaseType, packageName, suggestedVersion } ),
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	} ];
}

function getSuggestedVersion( bumpType: ReleaseType, version: string, releaseChannel: ReleaseChannel ) {
	if ( bumpType === 'prerelease' && releaseChannel !== 'latest' ) {
		return semver.inc( version, bumpType, releaseChannel );
	} else if ( bumpType === 'prerelease' && releaseChannel === 'latest' ) {
		// Using 'premajor` and `alpha` channel for a case, when introducing a prerelease for the next major.
		// E.g. 1.0.0 -> 2.0.0-alpha.0.

		return semver.inc( version, 'premajor', 'alpha' );
	} else {
		return semver.inc( version, bumpType );
	}
}
