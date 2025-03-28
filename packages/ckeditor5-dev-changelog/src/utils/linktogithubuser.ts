/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Converts GitHub usernames in text to GitHub profile links.
 * This function enhances changelog entries by linking contributor usernames to their GitHub profiles.
 */
export function linkToGitHubUser( comment: string ): string {
	return comment.replace( /(^|[\s(])@([\w-]+)(?![/\w-])/ig, ( _, charBefore, nickName ) => {
		return `${ charBefore }[@${ nickName }](https://github.com/${ nickName })`;
	} );
}
