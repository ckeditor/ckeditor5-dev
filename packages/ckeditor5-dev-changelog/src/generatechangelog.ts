/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format } from 'date-fns';
import type { RawDateString, RepositoryConfig, TransformScope } from './types.js';
import { getSectionsWithEntries } from './utils/getsectionswithentries.js';
import { NPM_URL, VERSIONING_POLICY_URL } from './constants.js';
import { logChangelogFiles } from './utils/logchangelogfiles.js';
import { removeChangesetFiles } from './utils/removechangesetfiles.js';
import { modifyChangelog } from './utils/modifychangelog.js';
import { getNewVersion } from './utils/getnewversion.js';
import { getReleasePackagesPkgJsons } from './utils/getreleasepackagespkgjsons.js';
import { getReleasedPackagesInfo } from './utils/getreleasedpackagesinfo.js';
import { getChangesetFilePaths } from './utils/getchangesetfilepaths.js';
import { getChangesetsParsed } from './utils/getchangesetsparsed.js';
import { getGitHubUrl } from './utils/getgithuburl.js';
import { getPackageJson } from './utils/getpackagejson.js';
import { getSectionsToDisplay } from './utils/getsectionstodisplay.js';
import { logInfo } from './utils/loginfo.js';
import { getDateFormatted } from './utils/getdateformatted.js';
import chalk from 'chalk';

/**
 * Generates a changelog for the repository based on changeset files and package information.
 *
 * @param options - Configuration options for changelog generation
 * @param options.cwd - Current working directory
 * @param options.packagesDirectory - Directory containing packages (default: 'packages')
 * @param options.nextVersion - Optional next version to use (if not provided, will prompt)
 * @param options.externalRepositories - Array of external repository configurations
 * @param options.transformScope - Function to transform package scopes
 * @param options.date - Release date in yyyy-MM-dd format (default: current date)
 * @param options.changesetsDirectory - Directory containing changeset files (default: '.changelog')
 * @throws {Error} If no valid packages are found for release
 */
export async function generateChangelog( {
	cwd,
	packagesDirectory = 'packages',
	nextVersion,
	externalRepositories = [],
	transformScope,
	date = format( new Date(), 'yyyy-MM-dd' ) as RawDateString,
	changesetsDirectory = '.changelog'
}: RepositoryConfig & {
	nextVersion?: string;
	externalRepositories?: Array<RepositoryConfig>;
	transformScope: TransformScope;
	date?: RawDateString;
	changesetsDirectory?: string;
} ): Promise<void> {
	// Get all required information for changelog generation
	const [
		packages,
		gitHubUrl,
		packageInfo,
		dateFormatted,
		changesetFilePaths,
		parsedChangesetFiles
	] = await Promise.all( [
		getReleasePackagesPkgJsons( cwd, packagesDirectory, externalRepositories ),
		getGitHubUrl( cwd ),
		getPackageJson( cwd ),
		getDateFormatted( date ),
		getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories ),
		getChangesetsParsed( await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories ) )
	] );

	const { version: oldVersion, name: rootPackageName } = packageInfo;

	// Process changesets and get sections with entries
	const sectionsWithEntries = getSectionsWithEntries( {
		parsedFiles: parsedChangesetFiles,
		packages,
		gitHubUrl,
		transformScope
	} );

	// Log changes for review
	logChangelogFiles( sectionsWithEntries );

	// Get new version and prepare sections for display
	const newVersion = nextVersion ?? await getNewVersion( sectionsWithEntries, oldVersion, rootPackageName );
	const sectionsToDisplay = getSectionsToDisplay( sectionsWithEntries );

	// Check if there are valid packages to release
	if ( !sectionsToDisplay.length ) {
		logInfo( '📍 ' + chalk.yellow( 'No valid packages to release found. Aborting.' ) );
		return;
	}

	// Get released packages information
	const releasedPackagesInfo = await getReleasedPackagesInfo( {
		sections: sectionsWithEntries,
		oldVersion,
		newVersion,
		packages
	} );

	// Generate new changelog content
	const newChangelog = generateChangelogContent( {
		oldVersion,
		newVersion,
		dateFormatted,
		gitHubUrl,
		sectionsToDisplay,
		releasedPackagesInfo
	} );

	// Update changelog file and clean up
	await Promise.all( [
		modifyChangelog( newChangelog, cwd ),
		removeChangesetFiles( changesetFilePaths, cwd, changesetsDirectory, externalRepositories )
	] );

	logInfo( '📍 ' + chalk.green( 'Done!' ) );
}

/**
 * Generates the content for the new changelog entry.
 *
 * @param options - Options for generating changelog content
 * @returns Formatted changelog content
 */
function generateChangelogContent( {
	oldVersion,
	newVersion,
	dateFormatted,
	gitHubUrl,
	sectionsToDisplay,
	releasedPackagesInfo
}: {
	oldVersion: string;
	newVersion: string;
	dateFormatted: string;
	gitHubUrl: string;
	sectionsToDisplay: Array<{ title: string; entries: Array<{ message: string }> }>;
	releasedPackagesInfo: Array<{ title: string; version: string; packages: Array<string> }>;
} ): string {
	const versionHeader = oldVersion === '0.0.1' ?
		`## ${ newVersion } (${ dateFormatted })` :
		`## [${ newVersion }](${ gitHubUrl }/compare/v${ oldVersion }...v${ newVersion }) (${ dateFormatted })`;

	const sectionsContent = sectionsToDisplay.map( ( { title, entries } ) => [
		`### ${ title }`,
		'',
		...entries.map( entry => entry.message ),
		''
	] ).flat();

	const releasedPackagesContent = [
		'### Released packages',
		'',
		`Check out the [Versioning policy](${ VERSIONING_POLICY_URL }) guide for more information.`,
		'',
		'<details>',
		'<summary>Released packages (summary)</summary>',
		...releasedPackagesInfo.map( ( { title, version, packages } ) => [
			'',
			title,
			'',
			...packages.map( packageName => `* [${ packageName }](${ NPM_URL }/${ packageName }/v/${ newVersion }): ${ version }` )
		] ).flat(),
		'</details>',
		''
	];

	return [
		versionHeader,
		'',
		...sectionsContent,
		...releasedPackagesContent
	].join( '\n' );
}
