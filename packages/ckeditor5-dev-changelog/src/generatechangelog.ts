/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format } from 'date-fns';
import chalk from 'chalk';
import { CHANGESET_DIRECTORY, ORGANISATION_NAMESPACE, PACKAGES_DIRECTORY_NAME } from './constants.js';
import type { GenerateChangelog, RawDateString, RepositoryConfig } from './types.js';
import { getSectionsWithEntries } from './utils/getsectionswithentries.js';
import { logChangelogFiles } from './utils/logchangelogfiles.js';
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
import { getNewChangelog } from './utils/getnewchangelog.js';
import { removeChangesetFiles } from './utils/removechangesetfiles.js';

/**
 * This function handles the entire changelog generation process including version management,
 * package information gathering, and changelog file updates.
 */
export async function generateChangelog( {
	nextVersion,
	cwd = process.cwd(),
	packagesDirectory = PACKAGES_DIRECTORY_NAME,
	organisationNamespace = ORGANISATION_NAMESPACE,
	externalRepositories = [],
	transformScope = defaultTransformScope,
	date = format( new Date(), 'yyyy-MM-dd' ) as RawDateString,
	changesetsDirectory = CHANGESET_DIRECTORY,
	skipLinks = false
}: RepositoryConfig & GenerateChangelog ): Promise<void> {
	const externalRepositoriesWithDefaults = getExternalRepositoriesWithDefaults( externalRepositories );
	const packageJsons = await getPackageJsons( cwd, packagesDirectory, externalRepositoriesWithDefaults );
	const gitHubUrl = await getRepositoryUrl( cwd );
	const { version: oldVersion, name: rootPackageName } = await getPackageJson( cwd );
	const dateFormatted = getDateFormatted( date );
	const changesetFilePaths = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositoriesWithDefaults, skipLinks );
	const parsedChangesetFiles = await getChangesetsParsed( changesetFilePaths );
	const sectionsWithEntries = getSectionsWithEntries( {
		parsedFiles: parsedChangesetFiles,
		packageJsons,
		transformScope,
		organisationNamespace
	} );

	const sectionsToDisplay = getSectionsToDisplay( sectionsWithEntries );

	// Logging changes in the console.
	logChangelogFiles( sectionsWithEntries );

	// Displaying a prompt to provide a new version in the console.
	const { isInternal, newVersion } = await getNewVersion( sectionsWithEntries, oldVersion, rootPackageName, nextVersion );

	const releasedPackagesInfo = await getReleasedPackagesInfo( {
		sections: sectionsWithEntries,
		oldVersion,
		newVersion,
		packageJsons,
		organisationNamespace
	} );

	const newChangelog = getNewChangelog( {
		oldVersion,
		newVersion,
		dateFormatted,
		gitHubUrl,
		sectionsToDisplay,
		releasedPackagesInfo,
		isInternal,
		packageJsons
	} );

	await modifyChangelog( newChangelog, cwd );
	await removeChangesetFiles( changesetFilePaths, cwd, changesetsDirectory, externalRepositories );

	// TODO consider commiting the changes here or in a separate command.

	logInfo( '○ ' + chalk.green( 'Done!' ) );
}
