/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format } from 'date-fns';
import type { RepositoryConfig } from './types.js';
import { getSectionsWithEntries } from './utils/getSectionsWithEntries.js';
import { NPM_URL, VERSIONING_POLICY_URL } from './constants.js';
import { logChangelogFiles } from './utils/logChangelogFiles.js';
import { removeChangesetFiles } from './utils/removeChangesetFiles.js';
import { modifyChangelog } from './utils/modifyChangelog.js';
import { getNewVersion } from './utils/getNewVersion.js';
import { getReleasePackagesPkgJsons } from './utils/getReleasePackagesPkgJsons.js';
import { getReleasedPackagesInfo } from './utils/getReleasedPackagesInfo.js';
import { getChangesetFilePaths } from './utils/getChangesetFilePaths.js';
import { getChangesetsParsed } from './utils/getChangesetsParsed.js';
import { getGitHubUrl } from './utils/getGitHubUrl.js';
import { getOldVersion } from './utils/getOldVersion.js';
import { getSectionsToDisplay } from './utils/getSectionsToDisplay.js';
import { logInfo } from './utils/logInfo.js';
import { getDateFormatted } from './utils/getDateFormatted.js';
import chalk from 'chalk';

export async function generateChangelog( {
	cwd,
	nextVersion,
	packagesDirectory = 'packages',
	externalRepositories = [],
	date = format( new Date(), 'yyyy-MM-dd' ) as any,
	organisationNamespace = '@ckeditor',
	packagePrefix = 'ckeditor5-',
	changesetsDirectory = '.changelog'
}: RepositoryConfig & {
	nextVersion?: string;
	externalRepositories?: Array<RepositoryConfig>;
	date?: `${ number }-${ number }-${ number }`;
	organisationNamespace?: string;
	packagePrefix?: string;
	changesetsDirectory?: string;
} ): Promise<void> {
	// An array of package.json files of packages to be included in generated changelog.
	const packages = await getReleasePackagesPkgJsons( cwd, packagesDirectory, externalRepositories );
	const gitHubUrl = await getGitHubUrl( cwd );
	const oldVersion = await getOldVersion( cwd );
	const dateFormatted = getDateFormatted( date );
	const changesetFilePaths = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories );
	const parsedChangesetFiles = await getChangesetsParsed( changesetFilePaths );
	const sectionsWithEntries = getSectionsWithEntries( {
		entries: parsedChangesetFiles,
		packages,
		organisationNamespace,
		packagePrefix,
		gitHubUrl
	} );

	// Logging changes in the console.
	logChangelogFiles( sectionsWithEntries );

	// Displaying a prompt to provide a new version in the console.
	const newVersion = nextVersion ?? await getNewVersion( sectionsWithEntries, oldVersion );
	const sectionsToDisplay = getSectionsToDisplay( sectionsWithEntries );
	const releasedPackagesInfo = await getReleasedPackagesInfo( {
		sections: sectionsWithEntries,
		oldVersion,
		newVersion,
		packages,
		organisationNamespace
	} );

	if ( !sectionsToDisplay.length ) {
		logInfo( '📍 ' + chalk.yellow( 'No walid packages to release found. Aborting.' ) );

		return;
	}

	const newChangelog = [
		`## [${ newVersion }](${ gitHubUrl }/releases/tag/v${ newVersion }) (${ dateFormatted })`,
		'',
		...sectionsToDisplay.map( ( [ , { title, entries } ] ) => ( [
			`### ${ title }`,
			'',
			...entries.map( entry => entry.message ),
			''
		] ) ),
		'### Released packages',
		'',
		`Check out the [Versioning policy](${ VERSIONING_POLICY_URL }) guide for more information.`,
		'',
		'<details>',
		'<summary>Released packages (summary)</summary>',
		...releasedPackagesInfo.map( ( { title, version, packages } ) => ( [
			'',
			title,
			'',
			...packages.map( packageName => `* [${ packageName }](${ NPM_URL }/${ packageName }/v/${ newVersion }): ${ version }` )
		] ) ),
		'</details>',
		''
	].flat().join( '\n' );

	await modifyChangelog( newChangelog, cwd );
	await removeChangesetFiles( changesetFilePaths, cwd, changesetsDirectory, externalRepositories );

	logInfo( '📍 ' + chalk.green( 'Done!' ) );
}
