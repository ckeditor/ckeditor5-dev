import path from 'path';
import fs from 'fs';
import upath from 'upath';

// todo unify this with other changelog
const CHANGELOG_HEADER = 'Changelog\n=========\n\n';
const CHANGELOG_FILE = 'CHANGELOG.md';

export function truncateChangelog( length: number, cwd = process.cwd() ) {
	const changelog = getChangelog( cwd );

	if ( !changelog ) {
		return;
	}

	const entryHeader = '## [\\s\\S]+?';
	const entryHeaderRegexp = new RegExp( `\\n(${ entryHeader })(?=\\n${ entryHeader }|$)`, 'g' );

	const entries = [ ...changelog.matchAll( entryHeaderRegexp ) ]
		.filter( match => match && match[ 1 ] )
		.map( match => match[ 1 ] );

	if ( !entries.length ) {
		return;
	}

	const truncatedEntries = entries.slice( 0, length );

	const changelogFooter = entries.length > truncatedEntries.length ?
		`\n\n---\n\nTo see all releases, visit the [release page](${ getRepositoryUrl( cwd ) }/releases).\n` :
		'\n';

	const truncatedChangelog = CHANGELOG_HEADER + truncatedEntries.join( '\n' ).trim() + changelogFooter;

	saveChangelog( truncatedChangelog, cwd );
}

function getChangelog( cwd = process.cwd() ) {
	// todo extract changelog to consts
	const changelogFile = path.join( cwd, CHANGELOG_FILE );

	if ( !fs.existsSync( changelogFile ) ) {
		return null;
	}

	return fs.readFileSync( changelogFile, 'utf-8' );
}

function saveChangelog( content: string, cwd = process.cwd() ) {
	const changelogFile = path.join( cwd, CHANGELOG_FILE );

	fs.writeFileSync( changelogFile, content, 'utf-8' );
}

export function getRepositoryUrl( cwd = process.cwd() ) {
	const packageJson = getPackageJson( cwd );

	// Due to merging our issue trackers, `packageJson.bugs` will point to the same place for every package.
	// We cannot rely on this value anymore. See: https://github.com/ckeditor/ckeditor5/issues/1988.
	// Instead of we can take a value from `packageJson.repository` and adjust it to match to our requirements.
	let repositoryUrl = ( typeof packageJson.repository === 'object' ) ? packageJson.repository.url : packageJson.repository;

	if ( !repositoryUrl ) {
		throw new Error( `The package.json for "${ packageJson.name }" must contain the "repository" property.` );
	}

	// If the value ends with ".git", we need to remove it.
	repositoryUrl = repositoryUrl.replace( /\.git$/, '' );

	// Remove "/issues" suffix as well.
	repositoryUrl = repositoryUrl.replace( /\/issues/, '' );

	return repositoryUrl;
}

// todo replace with my util
function getPackageJson( cwd = process.cwd() ) {
	let pkgJsonPath = cwd;

	if ( !pkgJsonPath.endsWith( 'package.json' ) ) {
		pkgJsonPath = upath.join( cwd, 'package.json' );
	}

	return JSON.parse( fs.readFileSync( pkgJsonPath, 'utf-8' ) );
}
