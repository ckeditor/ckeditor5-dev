/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { styleText } from 'util';
import semver, { type ReleaseType } from 'semver';
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
	const { customVersion, version } = await inquirer.prompt( question as any );

	return customVersion || version;
}

/**
 * Displays a warning message about invalid changes in a visible color.
 */
function displayInvalidChangesWarning(): void {
	logInfo( '' );
	logInfo( styleText( [ 'yellow', 'bold' ], `⚠️  ${ styleText( 'underline', 'WARNING: Invalid changes detected!' ) }` ) );
	logInfo( '' );
	logInfo( styleText( 'yellow', 'You can cancel the process, fix the invalid files, and run the tool again.' ) );
	logInfo( styleText( 'yellow', 'Alternatively, you can continue - but invalid values will be lost.' ) );
	logInfo( '' );
}

/**
 * Asks the user if they want to continue with the version bump process.
 */
async function askContinueConfirmation( indentLevel: number = 0 ): Promise<boolean> {
	const question = {
		type: 'confirm',
		name: 'continue',
		message: 'Should continue?',
		default: false,
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + styleText( 'cyan', '?' )
	};

	const answers = await inquirer.prompt<{ continue: boolean }>( question as any );

	return answers.continue;
}

/**
 * Creates a prompt question for version input with validation.
 */
function createVersionQuestion( options: Options ) {
	const { version, packageName, bumpType, releaseChannel, releaseType, indentLevel = 0 } = options;
	const suggestedVersion = getSuggestedVersion( bumpType, version, releaseChannel ) || version;
	const message = [
		'Select the new version.',
		`Current version: ${ styleText( 'cyan', version ) }.`,
		`Suggested version: ${ styleText( 'cyan', suggestedVersion ) }.`
	].join( ' ' );

	return [ {
		type: 'list',
		name: 'version',
		default: suggestedVersion,
		message,
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + styleText( 'cyan', '?' ),
		choices: getChoices( { version, bumpType, releaseChannel, releaseType } )
	}, {
		type: 'input',
		name: 'customVersion',
		message: 'Enter your custom version:',
		when: ( { version }: { version: string } ) => version === 'custom',
		filter: ( newVersion: string ) => newVersion.trim(),
		validate: ( newVersion: string ) => validateInputVersion( { newVersion, version, releaseType, packageName, suggestedVersion } ),
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + styleText( 'cyan', '?' )
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

function getChoices( {
	version,
	bumpType,
	releaseChannel,
	releaseType
}: {
	version: string;
	bumpType: ReleaseType;
	releaseChannel: ReleaseChannel;
	releaseType: ChangelogReleaseType;
} ) {
	const proposedVersions: Array<string> = [];
	const preReleaseChannels = [ 'alpha', 'beta', 'rc' ];
	const validPromotionChannels = preReleaseChannels.filter( ( value, index, array ) => index >= array.indexOf( releaseChannel ) );

	// 6.0.0 => Latest (stable) release (7.0.0 | 6.1.0 | 6.0.1)
	if ( bumpType !== 'prerelease' && releaseType === 'latest' && releaseChannel === 'latest' ) {
		proposedVersions.push(
			semver.inc( version, 'major' )!,
			semver.inc( version, 'minor' )!,
			semver.inc( version, 'patch' )!
		);
	}

	// 6.0.0 => Pre-release (7.0.0-alpha.0 | 6.1.0-alpha.0 | 6.0.1-alpha.0)
	if ( bumpType === 'prerelease' && releaseType === 'prerelease' && releaseChannel === 'latest' ) {
		proposedVersions.push(
			semver.inc( version, 'premajor', 'alpha' )!,
			semver.inc( version, 'preminor', 'alpha' )!,
			semver.inc( version, 'prepatch', 'alpha' )!
		);
	}

	// 6.0.0-alpha.0 => Latest (stable) release (6.0.0)
	if ( bumpType !== 'prerelease' && releaseType === 'latest' && preReleaseChannels.includes( releaseChannel ) ) {
		proposedVersions.push(
			semver.inc( version, 'release' )!
		);
	}

	// 6.0.0-alpha.0 => Pre-release continuation (6.0.0-alpha.1)
	if ( bumpType === 'prerelease' && releaseType === 'prerelease' && preReleaseChannels.includes( releaseChannel ) ) {
		proposedVersions.push(
			semver.inc( version, 'prerelease', releaseChannel )!
		);
	}

	// 6.0.0-alpha.0 => Pre-release promotion (6.0.0-beta.0 | 6.0.0-rc.0)
	if ( bumpType === 'prerelease' && releaseType === 'prerelease-promote' && preReleaseChannels.includes( releaseChannel ) ) {
		proposedVersions.push(
			...validPromotionChannels.map( channel => semver.inc( version, 'prerelease', channel )! )
		);
	}

	return [
		...proposedVersions.map( proposedVersion => ( { name: proposedVersion, value: proposedVersion } ) ),
		{ name: 'Custom...', value: 'custom' }
	];
}
