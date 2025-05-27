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

		const scope = getScopesLinks( validatedData.scope, transformScope );
		const closes = getIssuesLinks( validatedData.closes, 'Closes', validatedEntry.gitHubUrl );
		const see = getIssuesLinks( validatedData.see, 'See', validatedEntry.gitHubUrl );
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

		sections[ section ].entries.push( newEntry );

		if ( isValid && newEntry.data.validations?.length ) {
			sections.warning.entries.push( newEntry );
		}

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
	if ( !issues?.length ) {
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

	const breakingChangeNormalized = entry.data[ 'breaking-change' ];

	// If someone tries to use minor/major breaking change in a single package, we simply cast it to a generic breaking change.
	if ( singlePackage ) {
		if ( [ 'minor', 'major', true ].includes( breakingChangeNormalized! ) ) {
			return 'breaking';
		}
	} else {
		if ( breakingChangeNormalized === 'minor' ) {
			return 'minor';
		}

		if ( breakingChangeNormalized === 'major' ) {
			return 'major';
		}
	}

	return entry.data.type?.toLowerCase() as SectionName;
}

function getInitialSectionsWithEntries(): SectionsWithEntries {
	const sections = structuredClone( SECTIONS ) as SectionsWithEntries;

	for ( const key in sections ) {
		sections[ key as SectionName ].entries = [];
	}

	return sections;
}
