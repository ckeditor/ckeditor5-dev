/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format } from 'date-fns';
import { RawDateString, RepositoryConfig, TransformScope } from './types.js';
import { getSectionsWithEntries } from './utils/getsectionswithentries.js';
import { NPM_URL, VERSIONING_POLICY_URL } from './constants.js';
import { logChangelogFiles } from './utils/logchangelogfiles.js';
import { removeChangesetFiles } from './utils/removechangesetfiles';
import { modifyChangelog } from './utils/modifychangelog.js';
import { getNewVersion } from './utils/getnewversion.js';
import { getReleasePackagesPkgJsons } from './utils/getreleasepackagespkgjsons.js';
import { getReleasedPackagesInfo } from './utils/getreleasedpackagesinfo.js';
import { getChangesetFilePaths } from './utils/getchangesetfilepaths.js';
import { getChangesetsParsed } from './utils/getchangesetsparsed.js';
import { getGitHubUrl } from './utils/getgithuburl.js';
import { getRootPackageJson } from './utils/getrootpackagejson';
import { getSectionsToDisplay } from './utils/getsectionstodisplay.js';
import { logInfo } from './utils/loginfo.js';
import { getDateFormatted } from './utils/getdateformatted.js';
import chalk from 'chalk';

export async function generateChangelog( {
	cwd,
	packagesDirectory,
	nextVersion,
	externalRepositories = [],
	transformScope,
	date = format( new Date(), 'yyyy-MM-dd' ) as RawDateString,
	organisationNamespace = '@ckeditor',
	changesetsDirectory = '.changelog'
}: RepositoryConfig & {
	nextVersion?: string;
	externalRepositories?: Array<RepositoryConfig>;
	transformScope: TransformScope;
	date?: RawDateString;
	organisationNamespace?: string;
	changesetsDirectory?: string;
} ): Promise<void> {
	// An array of package.json files of packages to be included in generated changelog.
	const packages = await getReleasePackagesPkgJsons( cwd, packagesDirectory, externalRepositories );
	const gitHubUrl = await getGitHubUrl( cwd );
	const { version: oldVersion, name: rootPackageName } = await getRootPackageJson( cwd );
	const dateFormatted = getDateFormatted( date );
	const changesetFilePaths = await getChangesetFilePaths( cwd, changesetsDirectory, externalRepositories );
	const parsedChangesetFiles = await getChangesetsParsed( changesetFilePaths );
	const sectionsWithEntries = getSectionsWithEntries( {
		entries: parsedChangesetFiles,
		packages,
		organisationNamespace,
		gitHubUrl,
		transformScope
	} );

	// Logging changes in the console.
	logChangelogFiles( sectionsWithEntries );

	// Displaying a prompt to provide a new version in the console.
	const newVersion = nextVersion ?? await getNewVersion( sectionsWithEntries, oldVersion, rootPackageName );
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
		oldVersion === '0.0.1' ?
			`## ${ newVersion } (${ dateFormatted })` :
			`## [${ newVersion }](${ gitHubUrl }/compare/v${ oldVersion }...v${ newVersion }) (${ dateFormatted })`,
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
