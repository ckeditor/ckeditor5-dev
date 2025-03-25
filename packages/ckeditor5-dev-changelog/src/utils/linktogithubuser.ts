/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export function linkToGithubUser( comment: string ): string {
	return comment.replace( /(^|[\s(])@([\w-]+)(?![/\w-])/ig, ( _, charBefore, nickName ) => {
		return `${ charBefore }[@${ nickName }](https://github.com/${ nickName })`;
	} );
}
