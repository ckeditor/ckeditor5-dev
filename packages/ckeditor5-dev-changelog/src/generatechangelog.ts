/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format } from 'date-fns';
import chalk from 'chalk';
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

/**
 * Configuration options for generating a changelog.
 */
type GenerateChangelog = {

	/**
	 * The next version number to use. If not provided, will be calculated based on changes.
	 */
	nextVersion?: string;

	/**
	 * Array of external repository configurations to include in the changelog.
	 */
	externalRepositories?: Array<RepositoryConfig>;

	/**
	 * Function to transform package scopes in the changelog entries.
	 */
	transformScope?: TransformScope;

	/**
	 * The date to use for the changelog entry. Defaults to current date in YYYY-MM-DD format.
	 */
	date?: RawDateString;

	/**
	 * Directory containing the changeset files. Defaults to '.changelog'.
	 */
	changesetsDirectory?: string;
};

function defaultTransformScope( name: string ) {
	return {
		displayName: name,
		npmUrl: `https://www.npmjs.com/package/${ name }`
	};
}

/**
 * Generates a changelog for the repository based on changeset files and package information.
 * This function handles the entire changelog generation process including version management,
 * package information gathering, and changelog file updates.
 */
export async function generateChangelog( {
	cwd,
	packagesDirectory = 'packages',
	nextVersion,
	externalRepositories = [],
	transformScope = defaultTransformScope,
	date = format( new Date(), 'yyyy-MM-dd' ) as RawDateString,
	changesetsDirectory = '.changelog'
}: RepositoryConfig & GenerateChangelog ): Promise<void> {
	const packages = await getReleasePackagesPkgJsons( cwd, packagesDirectory, externalRepositories );
	const gitHubUrl = await getGitHubUrl( cwd );
	const packageJson = await getPackageJson( cwd );
	const { version: oldVersion, name: rootPackageName } = packageJson;
	const dateFormatted = getDateFormatted( date );
	const changesetFilePaths = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories );
	const parsedChangesetFiles = await getChangesetsParsed( changesetFilePaths );
	const sectionsWithEntries = getSectionsWithEntries( {
		parsedFiles: parsedChangesetFiles,
		packages,
		gitHubUrl,
		transformScope
	} );

	const sectionsToDisplay = getSectionsToDisplay( sectionsWithEntries );

	if ( !sectionsToDisplay.length ) {
		logInfo( '📍 ' + chalk.yellow( `No valid changesets in the '${ changesetsDirectory }' directory found. Aborting.` ) );

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
		packages
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

	logInfo( '📍 ' + chalk.green( 'Done!' ) );
}
