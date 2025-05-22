/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import type {
	Entry, ParsedFile, SectionName, SectionsWithEntries, TransformScope } from '../types.js';
import { ISSUE_PATTERN, ISSUE_SLUG_PATTERN, ISSUE_URL_PATTERN, SECTIONS } from '../constants.js';
import { linkToGitHubUser } from '../utils/linktogithubuser.js';
import { normalizeEntry } from './normalizeentry.js';
import { validateEntry } from './validateentry.js';

type DifferentRepoIssue = { owner: string; repository: string; number: string };

/**
 * This function categorizes changelog entries based on their types and packages.
 */
export function getSectionsWithEntries( { parsedFiles, packageJsons, transformScope, singlePackage }: {
	parsedFiles: Array<ParsedFile>;
	packageJsons: Array<workspaces.PackageJson>;
	transformScope: TransformScope;
	singlePackage: boolean;
} ): SectionsWithEntries {
	const packagesNames = packageJsons.map( packageJson => packageJson.name );

	return parsedFiles.reduce<SectionsWithEntries>( ( sections, entry ) => {
		const normalizedEntry = normalizeEntry( entry );
		const { validatedEntry, isValid } = validateEntry( normalizedEntry, packagesNames, singlePackage );
		const validatedData = validatedEntry.data;

		const scope = getScopesLinks( validatedData.scopeNormalized, transformScope );
		const closes = getIssuesLinks( validatedData.closesNormalized, 'Closes', validatedEntry.gitHubUrl );
		const see = getIssuesLinks( validatedData.seeNormalized, 'See', validatedEntry.gitHubUrl );
		const section = getSection( { entry: validatedEntry, singlePackage, isValid } );
		const [ mainContent, ...restContent ] = linkToGitHubUser( validatedEntry.content ).trim().split( '\n\n' );

		const messageFirstLine = [
			'*',
			scope ? `**${ scope }**:` : null,
			mainContent,
			!entry.skipLinks && see ? see : null,
			!entry.skipLinks && closes ? closes : null
		].filter( Boolean ).join( ' ' );

		const changeMessage = restContent.length ? messageFirstLine + '\n\n  ' + restContent.join( '\n\n  ' ) : messageFirstLine;

		const newEntry: Entry = {
			message: changeMessage,
			data: { ...validatedData, mainContent, restContent },
			changesetPath: validatedEntry.changesetPath
		};

		sections[ section ].entries = [ ...sections[ section ].entries, newEntry ];

		return sections;
	}, getInitialSectionsWithEntries() );
}

function getScopesLinks( scope: Array<string> | undefined, transformScope: TransformScope ): string | null {
	if ( !scope ) {
		return null;
	}

	return scope
		.map( scope => transformScope( scope ) )
		.map( ( { displayName, npmUrl } ) => `[${ displayName }](${ npmUrl })` )
		.join( ', ' );
}

function getIssuesLinks( issues: Array<string> | undefined, prefix: string, gitHubUrl: string ): string | null {
	if ( !issues ) {
		return null;
	}

	const links = issues.map( String ).map( issue => {
		if ( issue.match( ISSUE_PATTERN ) ) {
			return `[#${ issue }](${ gitHubUrl }/issues/${ issue })`;
		}

		const differentRepoMatch = issue.match( ISSUE_SLUG_PATTERN );

		if ( differentRepoMatch ) {
			const { owner, repository, number } = differentRepoMatch.groups as DifferentRepoIssue;

			return `[${ issue }](https://github.com/${ owner }/${ repository }/issues/${ number })`;
		}

		const repoUrlMatch = issue.match( ISSUE_URL_PATTERN );

		if ( repoUrlMatch ) {
			const { owner, repository, number } = repoUrlMatch.groups as DifferentRepoIssue;

			return `[${ owner }/${ repository }#${ number }](${ issue })`;
		}

		return null;
	} );

	return `${ prefix } ${ links.join( ', ' ) }.`;
}

function getSection( { entry, singlePackage, isValid }: { entry: ParsedFile; singlePackage: boolean; isValid: boolean } ): SectionName {
	if ( !isValid ) {
		return 'invalid';
	}

	// If someone tries to use minor/major breaking change in a single package, we simply cast it to a generic breaking change.
	if ( singlePackage ) {
		if ( entry.data.typeNormalized === 'Minor' || entry.data.typeNormalized === 'Major' || entry.data.typeNormalized === 'Breaking' ) {
			return 'breaking';
		}
	} else {
		if ( entry.data.typeNormalized === 'Minor' ) {
			return 'minor';
		}

		if ( entry.data.typeNormalized === 'Major' ) {
			return 'major';
		}
	}

	if ( entry.data.typeNormalized === 'Feature' ) {
		return 'feature';
	}

	if ( entry.data.typeNormalized === 'Fix' ) {
		return 'fix';
	}

	if ( entry.data.typeNormalized === 'Other' ) {
		return 'other';
	}

	return 'invalid';
}

function getInitialSectionsWithEntries(): SectionsWithEntries {
	const sections = structuredClone( SECTIONS ) as SectionsWithEntries;

	for ( const key in sections ) {
		sections[ key as SectionName ].entries = [];
	}

	return sections;
}
