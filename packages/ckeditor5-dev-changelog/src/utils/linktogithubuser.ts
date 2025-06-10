/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * This function enhances changelog entries by linking contributor usernames to their GitHub profiles.
 *
 * It searches for occurrences of GitHub-style mentions (e.g., @username) in the given comment string
 * and transforms them into Markdown links pointing to the corresponding GitHub user page.
 */
export function linkToGitHubUser( comment: string ): string {
	return comment.replace( /(^|[\s(])@([\w-]+)(?![/\w-])/ig, ( _, charBefore, nickName ) => {
		return `${ charBefore }[@${ nickName }](https://github.com/${ nickName })`;
	} );
}
