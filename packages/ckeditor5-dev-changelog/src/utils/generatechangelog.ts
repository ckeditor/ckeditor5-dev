/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { format } from 'date-fns';
import chalk from 'chalk';
import type { ConfigBase, GenerateChangelogEntryPoint, MonoRepoConfigBase } from '../types.js';
import { getSectionsWithEntries } from '../utils/getsectionswithentries.js';
import { logChangelogFiles } from '../utils/logchangelogfiles.js';
import { modifyChangelog } from '../utils/modifychangelog.js';
import { getNewVersion } from '../utils/getnewversion.js';
import { findPackages } from '../utils/findpackages.js';
import { getReleasedPackagesInfo } from '../utils/getreleasedpackagesinfo.js';
import { getChangesetFilePaths } from '../utils/getchangesetfilepaths.js';
import { getInputParsed } from '../utils/getinputparsed.js';
import { getSectionsToDisplay } from '../utils/getsectionstodisplay.js';
import { logInfo } from '../utils/loginfo.js';
import { getNewChangelog } from '../utils/getnewchangelog.js';
import { removeChangesetFiles } from '../utils/removechangesetfiles.js';
import { commitChanges } from '../utils/commitchanges.js';
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

	// TODO: if: isSinglePackage = false, then require transformScope.
	validateArguments( skipRootPackage, npmPackageToCheck );

	const packageNames = await findPackages( { cwd, packagesDirectory, skipRootPackage, externalRepositories } );
	const { version: oldVersion, name: rootPackageName } = await workspaces.getPackageJson( cwd, { async: true } );

	const changesetFilePaths = await getChangesetFilePaths( cwd, externalRepositories, shouldSkipLinks );
	const parsedChangesetFiles = await getInputParsed( changesetFilePaths );

	const sectionsWithEntries = getSectionsWithEntries( {
		parsedFiles: parsedChangesetFiles,
		packageNames,
		transformScope,
		isSinglePackage
	} );

	// Logging changes in the console.
	logChangelogFiles( sectionsWithEntries, parsedChangesetFiles.length, transformScope, isSinglePackage, !!nextVersion );

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
		packageNames
	} );

	const newChangelog = await getNewChangelog( {
		cwd,
		date,
		oldVersion,
		newVersion,
		sectionsToDisplay,
		releasedPackagesInfo,
		isInternal,
		packageJsons: packageNames,
		isSinglePackage
	} );

	if ( disableFilesystemOperations ) {
		// TODO: Could we remove `as any`?
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

// TODO think if it's needed
function validateArguments( skipRootPackage: undefined | boolean, npmPackageToCheck: string | undefined ) {
	if ( skipRootPackage && npmPackageToCheck === undefined ) {
		throw new Error( 'Provide npmPackageToCheck.' );
	}
}

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
