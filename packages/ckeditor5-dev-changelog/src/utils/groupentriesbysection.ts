/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { ISSUE_PATTERN, ISSUE_SLUG_PATTERN, ISSUE_URL_PATTERN, SECTIONS } from './constants.js';
import { linkToGitHubUser } from './linktogithubuser.js';
import { validateEntry } from './validateentry.js';
import type { Entry, ParsedFile, SectionName, SectionsWithEntries, TransformScope } from '../types.js';

type DifferentRepoIssue = { owner: string; repository: string; number: string };

type GroupEntriesBySectionOptions = {
	files: Array<ParsedFile>;
	packagesMetadata: Map<string, string>;
	transformScope?: TransformScope;
	isSinglePackage: boolean;
};

/**
 * This function categorizes changelog entries based on their types and packages.
 */
export function groupEntriesBySection( options: GroupEntriesBySectionOptions ): SectionsWithEntries {
	const { files, packagesMetadata, transformScope, isSinglePackage } = options;

	const packageNames = [ ...packagesMetadata.keys() ];

	return files.reduce<SectionsWithEntries>( ( sections, entry ) => {
		const { validatedEntry, isValid } = validateEntry( entry, packageNames, isSinglePackage );
		const validatedData = validatedEntry.data;

		const scope = isSinglePackage ? null : getScopesLinks( validatedData.scope, transformScope! );
		const closes = getIssuesLinks( validatedData.closes, 'Closes', validatedEntry.gitHubUrl );
		const see = getIssuesLinks( validatedData.see, 'See', validatedEntry.gitHubUrl );
		const section = getSection( { entry: validatedEntry, isSinglePackage, isValid } );
		const contentWithCommunityCredits = getContentWithCommunityCredits( validatedEntry.content, validatedData.communityCredits );
		const content = linkToGitHubUser( contentWithCommunityCredits );
		const [ mainContent, ...restContent ] = formatContent( content );

		const changeMessage = getChangeMessage( { restContent, scope, mainContent, entry, see, closes } );

		const newEntry: Entry = {
			message: changeMessage,
			data: {
				mainContent,
				restContent,
				type: validatedData.type,
				scope: validatedData.scope,
				see: validatedData.see.map( see => getIssueLinkObject( see, validatedEntry.gitHubUrl ) ),
				closes: validatedData.closes.map( closes => getIssueLinkObject( closes, validatedEntry.gitHubUrl ) ),
				validations: validatedData.validations,
				communityCredits: validatedData.communityCredits
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

type GetChangeMessageOptions = {
	mainContent: string | undefined;
	restContent: Array<string> | undefined;
	entry: ParsedFile;
	scope: string | null;
	see: string;
	closes: string;
};

function getChangeMessage( { restContent, scope, mainContent, entry, see, closes }: GetChangeMessageOptions ) {
	const messageFirstLine = [
		'*',
		scope ? `**${ scope }**:` : null,
		mainContent,
		!entry.shouldSkipLinks && see.length ? see : null,
		!entry.shouldSkipLinks && closes.length ? closes : null
	].filter( Boolean ).join( ' ' );

	if ( !restContent || !restContent.length ) {
		return messageFirstLine;
	}

	return `${ messageFirstLine }\n\n${ restContent.map( line => {
		if ( line.length ) {
			return `  ${ line }`;
		}
		return line;
	} ).join( '\n' ) }`;
}

function formatContent( content: string ) {
	const lines = content.trim()
		.split( '\n' )
		.map( line => line.trimEnd() );

	const mainIndex = lines.findIndex( line => line.trim() !== '' );
	const mainContent = lines.at( mainIndex )!;
	let restContent = lines.slice( mainIndex + 1 );

	if ( restContent.at( 0 )?.trim() === '' ) {
		restContent = restContent.slice( 1 );
	}

	const cleanedRestContent = restContent.reduce( ( acc, line ) => {
		if ( line.trim() === '' ) {
			// Only add empty line if the last item is not already an empty line
			if ( acc.length > 0 && acc.at( -1 ) !== '' ) {
				acc.push( '' );
			}
		} else {
			acc.push( line );
		}

		return acc;
	}, [] as Array<string> );

	return [ mainContent, ...cleanedRestContent ];
}

function getContentWithCommunityCredits( content: string, communityCredits: Array<string> | undefined ) {
	if ( !communityCredits?.length ) {
		return content;
	}

	return content.concat( `\n\nThanks to ${ communityCredits?.join( ', ' ) }.` );
}

function getScopesLinks( scope: Array<string>, transformScope: TransformScope ): string {
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

		if ( issue.startsWith( gitHubUrl ) ) {
			return { displayName: `#${ number }`, link: issue };
		}

		return { displayName: `${ owner }/${ repository }#${ number }`, link: issue };
	}

	return { displayName: '', link: '' };
}

function getIssuesLinks( issues: Array<string>, prefix: string, gitHubUrl: string ): string {
	if ( !issues.length ) {
		return '';
	}

	const links = issues.map( String ).map( issue => {
		const { displayName, link } = getIssueLinkObject( issue, gitHubUrl );

		return `[${ displayName }](${ link })`;
	} );

	return `${ prefix } ${ links.join( ', ' ) }.`;
}

function getSection( options: { entry: ParsedFile; isSinglePackage: boolean; isValid: boolean } ): SectionName {
	const { entry, isSinglePackage, isValid } = options;

	if ( !isValid ) {
		return 'invalid';
	}

	// If someone tries to use minor/major breaking change in a single package, we simply cast it to a generic breaking change.
	if ( isSinglePackage ) {
		const breakingChangeTypes = [ 'Minor breaking change', 'Major breaking change', 'Breaking change' ];

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

	return entry.data.type.toLowerCase() as SectionName;
}

function getInitialSectionsWithEntries(): SectionsWithEntries {
	const sections = structuredClone( SECTIONS ) as SectionsWithEntries;

	for ( const key in sections ) {
		sections[ key as SectionName ].entries = [];
	}

	return sections;
}
