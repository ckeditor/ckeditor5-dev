/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver, { type ReleaseType } from 'semver';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { validateVersionAvailability } from './validateversionavailability.js';
import { validateVersionHigherThanCurrent } from './validateversionhigherthancurrent.js';

const CLI_INDENT_SIZE = 3;

type Options = {
	packageName: string;
	version: string;
	bumpType: ReleaseType;
	indentLevel?: number;
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

/**
 * This function displays a prompt to provide a new version for all packages in the repository.
 * The version is being validated e.g. invalid version format or already used version are not accepted.
 */
export async function provideNewVersionForMonorepository( options: Options ): Promise<string> {
	const question = createVersionQuestion( options );
	const answers = await inquirer.prompt<{ version: string }>( question as any );

	return answers.version;
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
