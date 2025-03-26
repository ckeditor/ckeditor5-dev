/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

class GitHubUserLinker {
	private readonly githubUserPattern = /(^|[\s(])@([\w-]+)(?![/\w-])/ig;
	private readonly githubBaseUrl = 'https://github.com';

	/**
	 * Converts GitHub usernames in the comment to markdown links.
	 * Matches @username patterns that are not part of a longer string or path.
	 * 
	 * @param comment - Text containing GitHub usernames to convert
	 * @returns Text with GitHub usernames converted to markdown links
	 * @throws {Error} If the comment is invalid or processing fails
	 * 
	 * @example
	 * "Hello @user" -> "Hello [@user](https://github.com/user)"
	 * "Hello @user/package" -> "Hello @user/package" (unchanged)
	 * "(@user)" -> "([@user](https://github.com/user))"
	 */
	link(comment: string): string {
		try {
			if (!comment || typeof comment !== 'string') {
				throw new Error('Invalid comment: must be a non-empty string');
			}

			return this.processComment(comment);
		} catch (error) {
			throw new Error(
				`Failed to link GitHub users: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Processes the comment and converts GitHub usernames to markdown links.
	 * 
	 * @param comment - Text containing GitHub usernames to convert
	 * @returns Text with GitHub usernames converted to markdown links
	 */
	private processComment(comment: string): string {
		return comment.replace(this.githubUserPattern, (match, charBefore, nickName) => {
			return this.createMarkdownLink(charBefore, nickName);
		});
	}

	/**
	 * Creates a markdown link for a GitHub username.
	 * 
	 * @param charBefore - Character before the @ symbol
	 * @param nickName - GitHub username
	 * @returns Markdown link for the GitHub username
	 */
	private createMarkdownLink(charBefore: string, nickName: string): string {
		return `${charBefore}[@${nickName}](${this.githubBaseUrl}/${nickName})`;
	}
}

/**
 * Converts GitHub usernames in the comment to markdown links.
 * Matches @username patterns that are not part of a longer string or path.
 * 
 * @param comment - Text containing GitHub usernames to convert
 * @returns Text with GitHub usernames converted to markdown links
 * @throws {Error} If the comment is invalid or processing fails
 * 
 * @example
 * // Convert single username
 * const result = linkToGithubUser("Hello @user");
 * // result: "Hello [@user](https://github.com/user)"
 * 
 * // Convert multiple usernames
 * const result = linkToGithubUser("Thanks @user1 and @user2");
 * // result: "Thanks [@user1](https://github.com/user1) and [@user2](https://github.com/user2)"
 * 
 * // Preserve non-username @ mentions
 * const result = linkToGithubUser("Check @user/repo");
 * // result: "Check @user/repo"
 */
export function linkToGithubUser(comment: string): string {
	const linker = new GitHubUserLinker();
	return linker.link(comment);
}
