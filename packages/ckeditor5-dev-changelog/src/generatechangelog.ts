/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format } from 'date-fns';
import chalk from 'chalk';
import {
	CHANGESET_DIRECTORY,
	NPM_URL,
	ORGANISATION_NAMESPACE,
	PACKAGES_DIRECTORY_NAME,
	VERSIONING_POLICY_URL
} from './constants.js';
import type { GenerateChangelog, RawDateString, RepositoryConfig } from './types.js';
import { getSectionsWithEntries } from './utils/getsectionswithentries.js';
import { logChangelogFiles } from './utils/logchangelogfiles.js';
import { removeChangesetFiles } from './utils/removechangesetfiles.js';
import { modifyChangelog } from './utils/modifychangelog.js';
import { getNewVersion } from './utils/getnewversion.js';
import { getPackageJsons } from './utils/getreleasepackagespkgjsons.js';
import { getReleasedPackagesInfo } from './utils/getreleasedpackagesinfo.js';
import { getChangesetFilePaths } from './utils/getchangesetfilepaths.js';
import { getChangesetsParsed } from './utils/getchangesetsparsed.js';
import { getPackageJson } from './utils/getpackagejson.js';
import { getSectionsToDisplay } from './utils/getsectionstodisplay.js';
import { logInfo } from './utils/loginfo.js';
import { getDateFormatted } from './utils/getdateformatted.js';
import { defaultTransformScope } from './utils/defaulttransformscope.js';
import { getExternalRepositoriesWithDefaults } from './utils/getexternalrepositorieswithdefaults.js';
import { getRepositoryUrl } from './utils/external/getrepositoryurl.js';

/**
 * This function handles the entire changelog generation process including version management,
 * package information gathering, and changelog file updates.
 */
export async function generateChangelog( {
	cwd,
	packagesDirectory = PACKAGES_DIRECTORY_NAME,
	organisationNamespace = ORGANISATION_NAMESPACE,
	nextVersion,
	externalRepositories = [],
	transformScope = defaultTransformScope,
	date = format( new Date(), 'yyyy-MM-dd' ) as RawDateString,
	changesetsDirectory = CHANGESET_DIRECTORY
}: RepositoryConfig & GenerateChangelog ): Promise<void> {
	const externalRepositoriesWithDefaults = getExternalRepositoriesWithDefaults( externalRepositories );
	const packageJsons = await getPackageJsons( cwd, packagesDirectory, externalRepositoriesWithDefaults );
	const gitHubUrl = await getRepositoryUrl( cwd );
	const { version: oldVersion, name: rootPackageName } = await getPackageJson( cwd );
	const dateFormatted = getDateFormatted( date );
	const changesetFilePaths = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositoriesWithDefaults );
	const parsedChangesetFiles = await getChangesetsParsed( changesetFilePaths );
	const sectionsWithEntries = getSectionsWithEntries( {
		parsedFiles: parsedChangesetFiles,
		packageJsons,
		transformScope,
		organisationNamespace
	} );

	const sectionsToDisplay = getSectionsToDisplay( sectionsWithEntries );

	if ( !sectionsToDisplay.length ) {
		logInfo( '○ ' + chalk.yellow( `No valid changesets in the '${ changesetsDirectory }' directory found. Aborting.` ) );

		return;
	}

	// Logging changes in the console.
	logChangelogFiles( sectionsWithEntries );

	// Displaying a prompt to provide a new version in the console.
	const newVersion = nextVersion ?? await getNewVersion( sectionsWithEntries, oldVersion, rootPackageName );

	const releasedPackagesInfo = await getReleasedPackagesInfo( {
		sections: sectionsWithEntries,
		oldVersion,
		newVersion,
		packageJsons,
		organisationNamespace
	} );

	const newChangelog = [
		oldVersion === '0.0.1' ?
			`## ${ newVersion } (${ dateFormatted })` :
			`## [${ newVersion }](${ gitHubUrl }/compare/v${ oldVersion }...v${ newVersion }) (${ dateFormatted })`,
		'',
		...sectionsToDisplay.map( ( { title, entries } ) => ( [
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

	logInfo( '○ ' + chalk.green( 'Done!' ) );
}
