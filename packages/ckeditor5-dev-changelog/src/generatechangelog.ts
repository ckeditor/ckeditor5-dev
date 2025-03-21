/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import { glob } from 'glob';
import upath from 'upath';
import { fileURLToPath } from 'url';
import matter, { type GrayMatterFile } from 'gray-matter';
// todo fix handling types for dev-release-tools
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { provideNewVersionForMonoRepository, findPathsToPackages } from '@ckeditor/ckeditor5-dev-release-tools';
import chalk from 'chalk';

const __filename = fileURLToPath( import.meta.url );
const __dirname = upath.dirname( __filename );

// todo allow handling any package
const DEV_ROOT_DIRECTORY = upath.join( __dirname, '..', '..', '..' );
const CKEDITOR5_ROOT_DIRECTORY = upath.join( DEV_ROOT_DIRECTORY, '..', '..' );
const COMMERCIAL_ROOT_DIRECTORY = upath.join( CKEDITOR5_ROOT_DIRECTORY, 'external', 'ckeditor5-commercial' );
const CHANGELOG_DIR = upath.join( CKEDITOR5_ROOT_DIRECTORY, '.changelog' );
const CHANGELOG_FILE = upath.join( CKEDITOR5_ROOT_DIRECTORY, 'CHANGELOG.md' );
const GITHUB_URL = 'https://github.com/ckeditor/ckeditor5';
const NPM_URL = 'https://www.npmjs.com/package';
const BREAKING_CHANGE_URL = 'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html';
const VERSIONING_POLICY_URL = 'https://ckeditor.com/docs/ckeditor5/latest/framework/guides/support/versioning-policy.html';

// todo think if this should be moved to inside of a function using it
const SECTIONS = {
	major: { title: `MAJOR BREAKING CHANGES [ℹ️](${ BREAKING_CHANGE_URL }#major-and-minor-breaking-changes)` },
	minor: { title: `MINOR BREAKING CHANGES [ℹ️](${ BREAKING_CHANGE_URL }#major-and-minor-breaking-changes)` },
	Feature: { title: 'Features' },
	Fix: { title: 'Bug fixes' },
	Other: { title: 'Other changes' },
	invalid: { title: 'Invalid changes' }
};

type ChangelogEntry = GrayMatterFile<string>;

// todo add cwd support to handle multiple repos
export async function generateChangelog(): Promise<void> {
	const dateFormatted = new Date().toLocaleDateString( 'en-US', { month: 'long', day: 'numeric', year: 'numeric' } );
	const changelogFilePaths = await glob( '**/*.md', { cwd: CHANGELOG_DIR, absolute: true } );
	const changelogFiles = await Promise.all( changelogFilePaths.map( file => fs.readFile( file, 'utf-8' ) ) );
	const parsedChangelogFiles = changelogFiles.map( file => matter( file ) );
	const sectionsWithEntries = getSectionsWithEntries( parsedChangelogFiles );
	const sectionsToDisplay = Object.entries( sectionsWithEntries );
	const filteredSectionsToDisplay = sectionsToDisplay.filter( ( [ section, { entries } ] ) => entries && section !== 'invalid' );
	const rootPackageJson = await import( upath.join( CKEDITOR5_ROOT_DIRECTORY, 'package.json' ) );
	const oldVersion = rootPackageJson.version;

	// Logging changes in the console.
	logChangelogFiles( sectionsToDisplay );

	// Displaying a prompt to provide a new version in the console.
	const newVersion = await getNewVersion( sectionsWithEntries, oldVersion );
	const releasedPackagesInfo = await getReleasedPackagesInfo( sectionsWithEntries, oldVersion, newVersion );

	const newChangelog = [
		`## [${ newVersion }](${ GITHUB_URL }/releases/tag/v${ newVersion }) (${ dateFormatted })`,
		'',
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		...filteredSectionsToDisplay.map( ( [ _, { title, entries } ] ) => ( [
			`### ${ title }`,
			'',
			...entries.map( ( entry: any ) => entry.message ),
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

	await appendToChangelog( newChangelog );

	// todo remove last changelog entry
	// todo Delete processed source files
	// await Promise.all(changelogFilePaths.map(file => fs.unlink(file)));
}

function getSectionsWithEntries( entries: Array<ChangelogEntry> ) {
	// todo fix any
	return entries.reduce<Record<string, any>>( ( acc, entry ) => {
		const breakingChange = entry.data[ 'breaking-change' ];
		const type = entry.data.type ?? 'Other';
		const section = !isEntryValid( entry ) ? 'invalid' : breakingChange || type;
		const scope = getScopesLinks( entry.data.scope );
		const closes = getIssuesLinks( entry.data.closes, 'Closes' );
		const see = getIssuesLinks( entry.data.see, 'See' );
		const [ mainContent, ...restContent ] = entry.content.trim().split( '\n\n' );

		const changeMessage = [
			'*',
			scope ? `**${ scope }**:` : null,
			mainContent,
			restContent.length ? '\n\n  ' + restContent.join( '\n\n  ' ) : null,
			see ? see + '.' : null,
			closes ? closes + '.' : null
		].filter( Boolean ).join( ' ' );

		const newEntry = { message: changeMessage, data: { ...entry.data, mainContent, restContent } };

		acc[ section ].entries = [ ...acc[ section ].entries ?? [], newEntry ];

		return acc;
	}, structuredClone( SECTIONS ) );
}

type ReleaseInfo = Promise<Array<{ title: string; version: string; packages: Array<string> }>>;

async function getReleasedPackagesInfo( sections: Record<string, any>, oldVersion: string, newVersion: string ): ReleaseInfo {
	const versionUpgradeText = `${ oldVersion } => ${ newVersion }`;
	const packagesPaths = [
		...await findPathsToPackages( CKEDITOR5_ROOT_DIRECTORY, 'packages' ),
		...await findPathsToPackages( COMMERCIAL_ROOT_DIRECTORY, 'packages' )
	];
	const packages = packagesPaths.map( packagePath => import( upath.join( packagePath, 'package.json' ) ) );
	const resolvedPackages = await Promise.all( packages );
	const packageNames = resolvedPackages.map( packageName => packageName.name );

	// todo refactor this mess
	const newVersionReleases = resolvedPackages
		.filter( packageJson => packageJson.version === '0.0.1' )
		.map( packageJson => packageJson.name )
		.sort();

	const majorReleases = ( sections.major.entries ?? [] )
		.flatMap( ( entry: any ) => entry.data.scope )
		.map( ( scope: any ) => '@ckeditor/' + scope )
		.sort();

	const minorReleases = ( sections.minor.entries ?? [] )
		.flatMap( ( entry: any ) => entry.data.scope )
		.map( ( scope: any ) => '@ckeditor/' + scope )
		.filter( ( packageName: any ) => !majorReleases.includes( packageName ) )
		.sort();

	const newFeaturesReleases = ( sections.Feature.entries ?? [] )
		.flatMap( ( entry: any ) => entry.data.scope )
		.map( ( scope: any ) => '@ckeditor/' + scope )
		.filter( ( packageName: any ) => !minorReleases.includes( packageName ) )
		.sort();

	const otherReleases = packageNames
		.filter( packageName =>
			!majorReleases.includes( packageName ) &&
			!minorReleases.includes( packageName ) &&
			!newFeaturesReleases.includes( packageName )
		)
		.sort();

	return [
		{ title: 'New packages:', version: oldVersion, packages: newVersionReleases },
		{ title: 'Major releases (contain major breaking changes):', version: versionUpgradeText, packages: majorReleases },
		{ title: 'Minor releases (contain minor breaking changes):', version: versionUpgradeText, packages: minorReleases },
		{ title: 'Releases containing new features:', version: versionUpgradeText, packages: newFeaturesReleases },
		{ title: 'Other releases:', version: versionUpgradeText, packages: otherReleases }
	].filter( release => release.packages?.length > 0 );
}

function isEntryValid( entry: ChangelogEntry ) {
	// todo add more validations
	// todo add validation of scopes
	const expectedTypes = [ 'Feature', 'Fix', 'Other' ];

	if ( !expectedTypes.includes( entry.data.type ) ) {
		return false;
	}

	return true;
}

function getIssuesLinks( issues: Array<number>, prefix: string ) {
	return issues
		?.map( id => `${ prefix } ([#${ id }](${ GITHUB_URL }/issues/${ id }))` )
		.join( ', ' );
}

function getScopesLinks( scope: Array<string> ) {
	const getShortName = ( packageName: string ) => packageName.replace( 'ckeditor5-', '' );

	return scope
		?.map( packageName => `[${ getShortName( packageName ) }](${ NPM_URL }/@ckeditor/${ packageName })` )
		.join( ', ' );
}

// todo fix any
async function getNewVersion( sectionsWithEntries: any, oldVersion: string ): Promise<string> {
	logInfo( `📍 ${ chalk.cyan( 'Determining the new version...' ) }\n` );

	// todo think about using argument to read cwd
	let bumpType = 'patch';

	if ( sectionsWithEntries.minor.entries || sectionsWithEntries.Feature.entries ) {
		bumpType = 'minor';
	}

	if ( sectionsWithEntries.major.entries ) {
		bumpType = 'major';
	}

	return await provideNewVersionForMonoRepository( { version: oldVersion, packageName: 'ckeditor5', bumpType } );
}

// todo fix this function and handle it better
async function appendToChangelog( newChangelog: string ) {
	let existingChangelog = '';
	try {
		existingChangelog = await fs.readFile( CHANGELOG_FILE, 'utf-8' );
	} catch {
		// todo fix
		console.warn( 'CHANGELOG.md not found. Creating a new one.' );
	}

	// TODO improve changelog text handling
	const header = 'Changelog\n=========';
	const insertIndex = existingChangelog.indexOf( header );
	let changelog = '';

	if ( insertIndex !== -1 ) {
		// Find where to insert: after the header line
		const insertPosition = insertIndex + header.length; // +2 for newline characters
		changelog = existingChangelog.slice( 0, insertPosition ) + '\n\n' + newChangelog + existingChangelog.slice( insertPosition );
	} else {
		// If the header is missing, prepend everything
		changelog = `${ header }\n\n${ newChangelog }${ existingChangelog }`;
	}

	await fs.writeFile( CHANGELOG_FILE, changelog, 'utf-8' );
}

function logChangelogFiles( sections: Array<any> ) {
	logInfo( `📍 ${ chalk.cyan( 'Listing the changes...' ) }\n` );

	for ( const [ sectionName, section ] of sections ) {
		if ( !section.entries ) {
			continue;
		}

		const color = sectionName === 'invalid' ? chalk.red : chalk.green;

		logInfo( color( `🔸 Found ${ section.title }:` ), { indent: 2 } );

		for ( const entry of section.entries ) {
			logInfo( `* "${ entry.data.mainContent }"`, { indent: 4 } );

			if ( entry.data.restContent.length ) {
				entry.data.restContent.map( ( content: string ) => logInfo( chalk.italic( `"${ content }"` ), { indent: 6 } ) );
			}
		}

		logInfo( '' );
	}
}

function logInfo( text: string, { indent }: { indent: number } = { indent: 0 } ) {
	console.log( ' '.repeat( indent ) + text );
}
