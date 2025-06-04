/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { format } from 'date-fns';
import chalk from 'chalk';
import type { ConfigBase, GenerateChangelogEntryPoint, MonoRepoConfigBase } from '../types.js';
import { getSectionsWithEntries } from './getsectionswithentries.js';
import { logChangelogFiles } from './logchangelogfiles.js';
import { modifyChangelog } from './modifychangelog.js';
import { getNewVersion } from './getnewversion.js';
import { findPackages } from './findpackages.js';
import { getReleasedPackagesInfo } from './getreleasedpackagesinfo.js';
import { getChangesetFilePaths } from './getchangesetfilepaths.js';
import { getInputParsed } from './getinputparsed.js';
import { getSectionsToDisplay } from './getsectionstodisplay.js';
import { logInfo } from './loginfo.js';
import { getNewChangelog } from './getnewchangelog.js';
import { removeChangesetFiles } from './removechangesetfiles.js';
import { commitChanges } from './commitchanges.js';
import { InternalError } from '../errors/internalerror.js';

type GenerateChangelogConfig = ConfigBase & MonoRepoConfigBase & { isSinglePackage: boolean };

/**
 * This function handles the entire changelog generation process, including version management,
 * package information gathering, and changelog file updates.
 */
const main: GenerateChangelogEntryPoint<GenerateChangelogConfig> = async options => {
	const {
		nextVersion,
		packagesDirectory,
		isSinglePackage,
		transformScope,
		npmPackageToCheck,

		cwd = process.cwd(),
		externalRepositories = [],

		date = format( new Date(), 'yyyy-MM-dd' ),
		shouldSkipLinks = false,
		skipRootPackage = false,
		disableFilesystemOperations = false
	} = options;

	const packagesMetadata = await findPackages( { cwd, packagesDirectory, skipRootPackage, externalRepositories } );
	const { version: oldVersion, name: rootPackageName } = await workspaces.getPackageJson( cwd, { async: true } );

	const changesetFilePaths = await getChangesetFilePaths( cwd, externalRepositories, shouldSkipLinks );
	const parsedChangesetFiles = await getInputParsed( changesetFilePaths );

	const sectionsWithEntries = getSectionsWithEntries( {
		parsedFiles: parsedChangesetFiles,
		packagesMetadata,
		transformScope,
		isSinglePackage
	} );

	// Logging changes in the console.
	logChangelogFiles( sectionsWithEntries, parsedChangesetFiles.length, isSinglePackage, !!nextVersion, transformScope );

	const sectionsToDisplay = getSectionsToDisplay( sectionsWithEntries );

	// Displaying a prompt to provide a new version in the console.
	const { isInternal, newVersion } = await getNewVersion( {
		sectionsWithEntries,
		oldVersion,
		packageName: skipRootPackage && npmPackageToCheck ? npmPackageToCheck : rootPackageName,
		nextVersion
	} );

	const releasedPackagesInfo = await getReleasedPackagesInfo( {
		sections: sectionsWithEntries,
		oldVersion,
		newVersion,
		packagesMetadata
	} );

	const newChangelog = await getNewChangelog( {
		cwd,
		date,
		oldVersion,
		newVersion,
		sectionsToDisplay,
		releasedPackagesInfo,
		isInternal,
		packagesMetadata,
		isSinglePackage
	} );

	if ( disableFilesystemOperations ) {
		return newChangelog as any;
	}

	await removeChangesetFiles( changesetFilePaths, cwd, externalRepositories );
	await modifyChangelog( newChangelog, cwd );
	await commitChanges(
		newVersion,
		changesetFilePaths.map( ( { cwd, isRoot, changesetPaths } ) => ( { cwd, isRoot, changesetPaths } ) )
	);

	logInfo( '○ ' + chalk.green( 'Done!' ) );
};

/**
 * Wrapper function that provides error handling for the changelog generation process.
 */
export const generateChangelog: GenerateChangelogEntryPoint<GenerateChangelogConfig> = async options => {
	try {
		return main( options );
	} catch ( error ) {
		if ( !( error instanceof InternalError ) ) {
			throw error;
		}

		console.error( chalk.red( 'Error: ' + error.message ) );
		process.exit( 1 );
	}
};
