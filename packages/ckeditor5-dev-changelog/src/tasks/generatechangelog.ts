/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { format } from 'date-fns';
import chalk from 'chalk';
import { PACKAGES_DIRECTORY_NAME } from '../constants.js';
import type { ConfigBase, MonoRepoConfigBase } from '../types.js';
import { getSectionsWithEntries } from '../utils/getsectionswithentries.js';
import { logChangelogFiles } from '../utils/logchangelogfiles.js';
import { modifyChangelog } from '../utils/modifychangelog.js';
import { getNewVersion } from '../utils/getnewversion.js';
import { getPackageJsons } from '../utils/getreleasepackagespkgjsons.js';
import { getReleasedPackagesInfo } from '../utils/getreleasedpackagesinfo.js';
import { getChangesetFilePaths } from '../utils/getchangesetfilepaths.js';
import { getInputParsed } from '../utils/getinputparsed.js';
import { getSectionsToDisplay } from '../utils/getsectionstodisplay.js';
import { logInfo } from '../utils/loginfo.js';
import { getDateFormatted } from '../utils/getdateformatted.js';
import { defaultTransformScope } from '../utils/defaulttransformscope.js';
import { getExternalRepositoriesWithDefaults } from '../utils/getexternalrepositorieswithdefaults.js';
import { getNewChangelog } from '../utils/getnewchangelog.js';
import { removeChangesetFiles } from '../utils/removechangesetfiles.js';
import { removeScope } from '../utils/removescope.js';
import { commitChanges } from '../utils/commitchanges.js';
import { InternalError } from '../errors/internalerror.js';

type GenerateChangelog = <T extends boolean | undefined = undefined>(
	config: ConfigBase & MonoRepoConfigBase & { noWrite?: T; singlePackage: boolean }
) => Promise<T extends true ? string : void>; // eslint-disable-line @typescript-eslint/no-invalid-void-type

/**
 * This function handles the entire changelog generation process including version management,
 * package information gathering, and changelog file updates.
 */
const main: GenerateChangelog = async ( {
	nextVersion,
	cwd = process.cwd(),
	packagesDirectory = PACKAGES_DIRECTORY_NAME,
	externalRepositories = [],
	// TODO: An integrator should define it. No defaults here.
	// TODO: Required when `singlePackage=false`.
	transformScope = defaultTransformScope,
	date = format( new Date(), 'yyyy-MM-dd' ),
	shouldSkipLinks = false,
	singlePackage = false,
	skipRootPackage = false,
	npmPackageToCheck,
	// TODO: Merge `removeInputFiles` and `noWrite` options.
	noWrite = false,
	removeInputFiles = true
} ) => {
	validateArguments( skipRootPackage, npmPackageToCheck );
	// TODO: getExternalRepositoriesWithDefaults => `normalizeRepositories`.
	const externalRepositoriesWithDefaults = getExternalRepositoriesWithDefaults( externalRepositories );

	// TODO: If I understood correct purposes of this util, it should be renamed to: `findAvailablePackages`.
	const packageJsons = await getPackageJsons( cwd, packagesDirectory, externalRepositoriesWithDefaults, skipRootPackage );

	// TODO: This should be built-in `getExternalRepositoriesWithDefaults`.
	const gitHubUrl = await workspaces.getRepositoryUrl( cwd, { async: true } );

	const { version: oldVersion, name: rootPackageName } = await workspaces.getPackageJson( cwd, { async: true } );

	// TODO: It's an internal of `getNewChangelog()`.
	const dateFormatted = getDateFormatted( date );

	// TODO It should accept a single parameter: the normalized repositories array.
	const changesetFilePaths = await getChangesetFilePaths( cwd, externalRepositoriesWithDefaults, shouldSkipLinks );

	// TODO: Extract to an internal helper to replace `let` with `const`.
	let parsedChangesetFiles = await getInputParsed( changesetFilePaths );

	if ( singlePackage ) {
		parsedChangesetFiles = removeScope( parsedChangesetFiles );
	}

	const sectionsWithEntries = getSectionsWithEntries( {
		parsedFiles: parsedChangesetFiles,
		packageJsons,
		transformScope,
		singlePackage
	} );

	// Logging changes in the console.
	logChangelogFiles( sectionsWithEntries, parsedChangesetFiles.length, transformScope, singlePackage, !!nextVersion );

	const sectionsToDisplay = getSectionsToDisplay( sectionsWithEntries );

	// Displaying a prompt to provide a new version in the console.
	const { isInternal, newVersion } = await getNewVersion( {
		sectionsWithEntries,
		oldVersion,
		// TODO fix !
		packageName: skipRootPackage ? npmPackageToCheck! : rootPackageName,
		nextVersion
	} );

	const releasedPackagesInfo = await getReleasedPackagesInfo( {
		sections: sectionsWithEntries,
		oldVersion,
		newVersion,
		packageJsons
	} );

	const newChangelog = getNewChangelog( {
		oldVersion,
		newVersion,
		dateFormatted,
		gitHubUrl,
		sectionsToDisplay,
		releasedPackagesInfo,
		isInternal,
		packageJsons,
		singlePackage
	} );

	// TODO: Merge `removeInputFiles` and `noWrite` options. Then, rename:
	// * `disableFilesystemOperations`
	// * `noFilesystemChanges`
	// * `readonlyMode` (the question is why it changes the return type; perhaps it's bad option)
	// * `dryRun ` (as above)
	if ( removeInputFiles ) {
		await removeChangesetFiles( changesetFilePaths, cwd, externalRepositories );
	}

	if ( noWrite ) {
		return newChangelog as any;
	}

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
export const generateChangelog: GenerateChangelog = async options => {
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
