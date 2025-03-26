/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import inquirer from 'inquirer';
import semver from 'semver';
import type { SectionsWithEntries } from '../types.js';
import { logInfo } from './loginfo.js';
import chalk from 'chalk';

/**
 * Gets the new version for the release by either using the provided version or prompting the user.
 *
 * @param sections - Array of changeset sections
 * @param oldVersion - Current version
 * @param rootPackageName - Name of the root package
 * @returns The new version
 * @throws {Error} If the user cancels the prompt or if the version is invalid
 */
export async function getNewVersion(
	sections: SectionsWithEntries,
	oldVersion: string,
	rootPackageName: string
): Promise<string> {
	if ( !semver.valid( oldVersion ) ) {
		throw new Error( `Invalid current version: ${ oldVersion }` );
	}

	const suggestedVersion = suggestNewVersion( sections, oldVersion );
	return promptForVersion( suggestedVersion, rootPackageName );
}

/**
 * Suggests a new version based on the changeset sections and current version.
 *
 * @param sections - Array of changeset sections
 * @param oldVersion - Current version
 * @returns The suggested new version
 * @throws {Error} If the version calculation fails
 */
function suggestNewVersion( sections: SectionsWithEntries, oldVersion: string ): string {
	const hasBreakingChanges = hasBreakingChangesInSections( sections );
	const hasMinorChanges = hasMinorChangesInSections( sections );

	if ( hasBreakingChanges ) {
		return semver.inc( oldVersion, 'major' ) || oldVersion;
	}

	if ( hasMinorChanges ) {
		return semver.inc( oldVersion, 'minor' ) || oldVersion;
	}

	return semver.inc( oldVersion, 'patch' ) || oldVersion;
}

/**
 * Checks if there are any breaking changes in the sections.
 *
 * @param sections - Array of changeset sections
 * @returns True if there are breaking changes
 */
function hasBreakingChangesInSections( sections: SectionsWithEntries ): boolean {
	return Object.values( sections ).some( section =>
		section.entries.some( entry => entry.data[ 'breaking-change' ] !== undefined )
	);
}

/**
 * Checks if there are any minor changes in the sections.
 *
 * @param sections - Array of changeset sections
 * @returns True if there are minor changes
 */
function hasMinorChangesInSections( sections: SectionsWithEntries ): boolean {
	return Object.values( sections ).some( section =>
		section.entries.some( entry =>
			entry.data.scope.some( ( scope: string ) =>
				scope.toLowerCase().includes( 'feature' ) ||
				scope.toLowerCase().includes( 'minor' )
			)
		)
	);
}

/**
 * Prompts the user to confirm or modify the suggested version.
 *
 * @param suggestedVersion - The suggested version
 * @param rootPackageName - Name of the root package
 * @returns The confirmed or modified version
 * @throws {Error} If the user cancels the prompt
 */
async function promptForVersion( suggestedVersion: string, rootPackageName: string ): Promise<string> {
	logInfo( `📍 ${ chalk.cyan( 'Please provide a new version for the release.\n' ) }` );

	const { version } = await inquirer.prompt<{ version: string }>( [
		{
			type: 'input',
			name: 'version',
			message: `New version for ${ rootPackageName }:`,
			default: suggestedVersion,
			validate: validateVersion
		}
	] );

	return version;
}

/**
 * Validates that a version string is in the correct format.
 *
 * @param version - The version string to validate
 * @returns True if the version is valid, error message otherwise
 */
function validateVersion( version: string ): boolean | string {
	if ( !semver.valid( version ) ) {
		return 'Version must be a valid semver version (e.g., 1.2.3)';
	}

	return true;
}
