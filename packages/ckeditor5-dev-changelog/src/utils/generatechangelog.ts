/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import { format } from 'date-fns';
import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { groupEntriesBySection } from './groupentriesbysection.js';
import { displayChanges } from './displaychanges.js';
import { modifyChangelog } from './modifychangelog.js';
import { getNewVersion } from './getnewversion.js';
import { findPackages } from './findpackages.js';
import { getReleasedPackagesInfo } from './getreleasedpackagesinfo.js';
import { findChangelogEntryPaths } from './findchangelogentrypaths.js';
import { parseChangelogEntries } from './parsechangelogentries.js';
import { filterVisibleSections } from './filtervisiblesections.js';
import { logInfo } from './loginfo.js';
import { getNewChangelog } from './getnewchangelog.js';
import { removeChangelogEntryFiles } from './removechangelogentryfiles.js';
import { commitChanges } from './commitchanges.js';
import { InternalError } from './internalerror.js';
import type { ConfigBase, GenerateChangelogEntryPoint, MonoRepoConfigBase } from '../types.js';
import { UserAbortError } from './useraborterror.js';

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
		shouldIgnoreRootPackage = false,
		disableFilesystemOperations = false
	} = options;

	const { version: currentVersion, name: rootPackageName } = await workspaces.getPackageJson( cwd, { async: true } );
	const packagesMetadata = await findPackages( {
		cwd,
		packagesDirectory,
		shouldIgnoreRootPackage,
		externalRepositories
	} );
	const entryPaths = await findChangelogEntryPaths( {
		cwd,
		externalRepositories,
		shouldSkipLinks
	} );
	const parsedChangesetFiles = await parseChangelogEntries( entryPaths );
	const sectionsWithEntries = groupEntriesBySection( {
		packagesMetadata,
		transformScope,
		isSinglePackage,
		files: parsedChangesetFiles
	} );

	// Log changes in the console only when `nextVersion` is not provided.
	if ( !nextVersion ) {
		displayChanges( {
			isSinglePackage,
			transformScope,
			sections: sectionsWithEntries
		} );
	}

	// Display a prompt to provide a new version in the console.
	const { isInternal, newVersion } = await getNewVersion( {
		currentVersion,
		nextVersion,
		sections: sectionsWithEntries,
		packageName: shouldIgnoreRootPackage ? npmPackageToCheck! : rootPackageName
	} );

	const releasedPackagesInfo = await getReleasedPackagesInfo( {
		currentVersion,
		newVersion,
		packagesMetadata,
		sections: sectionsWithEntries
	} );

	const newChangelog = await getNewChangelog( {
		currentVersion,
		cwd,
		date,
		newVersion,
		isInternal,
		isSinglePackage,
		packagesMetadata,
		releasedPackagesInfo,
		sections: filterVisibleSections( sectionsWithEntries )
	} );
	if ( disableFilesystemOperations ) {
		return newChangelog as any;
	}

	await removeChangelogEntryFiles( {
		cwd,
		entryPaths,
		externalRepositories
	} );
	await modifyChangelog( newChangelog, cwd );
	await commitChanges(
		newVersion,
		entryPaths.map( ( { cwd, isRoot, filePaths } ) => ( { cwd, isRoot, filePaths } ) )
	);

	logInfo( '○ ' + chalk.green( 'Done!' ) );
};

/**
 * Wrapper function that provides error handling for the changelog generation process.
 */
export const generateChangelog: GenerateChangelogEntryPoint<GenerateChangelogConfig> = async options => {
	return main( options )
		.catch( error => {
			if ( isExpectedError( error ) ) {
				process.exit( 0 );
			} else if ( !( error instanceof InternalError ) ) {
				throw error;
			} else {
				console.error( chalk.red( 'Error: ' + error.message ) );
				process.exit( 1 );
			}
		} );
};

function isError( error: unknown ): error is Error {
	return typeof error === 'object' && error !== null && 'message' in error;
}

function isExpectedError( error: unknown ): boolean {
	if ( isError( error ) && error.message.includes( 'User force closed the prompt with SIGINT' ) ) {
		return true;
	}

	if ( error instanceof UserAbortError ) {
		return true;
	}

	return false;
}
