/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { ISSUE_PATTERN, ISSUE_SLUG_PATTERN, ISSUE_URL_PATTERN, SECTIONS } from './constants.js';
import { linkToGitHubUser } from '../utils/linktogithubuser.js';
import { normalizeEntry } from './normalizeentry.js';
import { validateEntry } from './validateentry.js';
import type { Entry, ParsedFile, SectionName, SectionsWithEntries, TransformScope, ValidatedFile, ValidatedType } from '../types.js';

type DifferentRepoIssue = { owner: string; repository: string; number: string };

/**
 * This function categorizes changelog entries based on their types and packages.
 */
export function getSectionsWithEntries( { parsedFiles, packageNames, transformScope, isSinglePackage }: {
	parsedFiles: Array<ParsedFile>;
	packageNames: Array<string>;
	transformScope?: TransformScope;
	isSinglePackage: boolean;
} ): SectionsWithEntries {
	return parsedFiles.reduce<SectionsWithEntries>( ( sections, entry ) => {
		const normalizedEntry = normalizeEntry( entry, isSinglePackage );
		const { validatedEntry, isValid } = validateEntry( normalizedEntry, packageNames, isSinglePackage );
		const validatedData = validatedEntry.data;

		const scope = isSinglePackage ? [] : getScopesLinks( validatedData.scope, transformScope! );
		const closes = getIssuesLinks( validatedData.closes, 'Closes', validatedEntry.gitHubUrl );
		const see = getIssuesLinks( validatedData.see, 'See', validatedEntry.gitHubUrl );
		const section = getSection( { entry: validatedEntry, isSinglePackage, isValid } );
		const contentWithCommunityCredits = getContentWithCommunityCredits( validatedEntry.content, validatedData.communityCredits );
		const content = linkToGitHubUser( contentWithCommunityCredits );
		const [ mainContent, ...restContent ] = formatContent( content );

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
			data: {
				...validatedData,
				mainContent,
				restContent,
				seeLinks: validatedData.see?.map( see => getIssueLinkObject( see, validatedEntry.gitHubUrl ) ),
				closesLinks: validatedData.closes?.map( closes => getIssueLinkObject( closes, validatedEntry.gitHubUrl ) )
			},
			changesetPath: validatedEntry.changesetPath
		};

		sections[ section ].entries.push( newEntry );

		if ( isValid && newEntry.data.validations?.length ) {
			sections.warning.entries.push( newEntry );
		}

		return sections;
	}, getInitialSectionsWithEntries() );
}

function formatContent( content: string ) {
	const contentByLines = content.trim().split( '\n\n' );

	return contentByLines?.filter( line => line.length ).map( line => trimLineBreaks( line ).trim() );
}

function getContentWithCommunityCredits( content: string, communityCredits: Array<string> | undefined ) {
	if ( !communityCredits?.length ) {
		return content;
	}

	return content.concat( `\n\nThanks to ${ communityCredits?.join( ', ' ) }.` );
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

function getIssueLinkObject( issue: string, gitHubUrl: string ) {
	if ( issue.match( ISSUE_PATTERN ) ) {
		return { displayName: `#${ issue }`, link: `${ gitHubUrl }/issues/${ issue }` };
	}

	const differentRepoMatch = issue.match( ISSUE_SLUG_PATTERN );

	if ( differentRepoMatch ) {
		const { owner, repository, number } = differentRepoMatch.groups as DifferentRepoIssue;

		return { displayName: issue, link: `https://github.com/${ owner }/${ repository }/issues/${ number }` };
	}

	const repoUrlMatch = issue.match( ISSUE_URL_PATTERN );

	if ( repoUrlMatch ) {
		const { owner, repository, number } = repoUrlMatch.groups as DifferentRepoIssue;

		return { displayName: `${ owner }/${ repository }#${ number }`, link: issue };
	}

	return { displayName: '', link: '' };
}

function getIssuesLinks( issues: Array<string> | undefined, prefix: string, gitHubUrl: string ): string | null {
	if ( !issues?.length ) {
		return null;
	}

	const links = issues.map( String ).map( issue => {
		const { displayName, link } = getIssueLinkObject( issue, gitHubUrl );

		return `[${ displayName }](${ link })`;
	} );

	return `${ prefix } ${ links.join( ', ' ) }.`;
}

function getSection( { entry, isSinglePackage, isValid }: { entry: ValidatedFile; isSinglePackage: boolean; isValid: boolean } ): SectionName {
	if ( !isValid ) {
		return 'invalid';
	}

	// If someone tries to use minor/major breaking change in a single package, we simply cast it to a generic breaking change.
	if ( isSinglePackage ) {
		const breakingChangeTypes: Array<ValidatedType> = [ 'Minor breaking change', 'Major breaking change', 'Breaking change' ];

		if ( breakingChangeTypes.includes( entry.data.type ) ) {
			return 'breaking';
		}
	} else {
		if ( entry.data.type === 'Minor breaking change' ) {
			return 'minor';
		}

		if ( entry.data.type === 'Major breaking change' ) {
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

function trimLineBreaks( str: string ) {
	return str.replace( /^[\r\n]+|[\r\n]+$/g, '' );
}
