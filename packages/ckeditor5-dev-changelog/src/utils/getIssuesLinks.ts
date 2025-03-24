/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export function getIssuesLinks( issues: Array<string>, prefix: string, gitHubUrl: string ): string {
	return prefix + ' ' + issues
		?.map( id => `[#${ id }](${ gitHubUrl }/issues/${ id })` )
		.join( ', ' ) + '.';
}
