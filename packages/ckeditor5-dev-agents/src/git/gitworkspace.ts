/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { realpath, rm } from 'node:fs/promises';
import upath from 'upath';
import { simpleGit, type SimpleGit } from 'simple-git';

export type GitWorkspace = {

	/**
	 * An absolute path to the root of the repository.
	 */
	path: string;

	/**
	 * The checked-out branch: the base of the report branches. `HEAD` when it is detached.
	 */
	branch: string;

	/**
	 * The repository on GitHub that `origin` points to, for example `ckeditor/ckeditor5`, or `undefined`.
	 */
	originSlug: string | undefined;

	/**
	 * Throws when the checkout cannot be published from: a detached `HEAD`, uncommitted changes, or a shallow history.
	 * The framework does not fix any of them. The environment that runs it must be prepared correctly.
	 */
	assertPublishable(): Promise<void>;

	/**
	 * Checks out the report branch of a task.
	 *
	 * When the report pull request is open, it continues that branch and merges the base branch into it first, so
	 * decisions and fixes merged to the base branch meanwhile are taken into account. A regular merge commit keeps
	 * review comments anchored. When there is no open pull request, a fresh branch starts at the base branch.
	 */
	checkoutReportBranch( options: { name: string; continueExisting: boolean } ): Promise<void>;

	/**
	 * Commits the given paths (relative to the repository root). Returns `false` when there was nothing to commit.
	 */
	commit( paths: Array<string>, message: string ): Promise<boolean>;

	/**
	 * Pushes the report branch with the credentials of the checkout. The first push of a replaced branch is forced,
	 * every later push is not.
	 */
	push(): Promise<void>;

	/**
	 * Drops anything a failed task left behind on the report branch and checks out the base branch again.
	 */
	returnToBase(): Promise<void>;

	/**
	 * Whether the ref (a branch, a remote branch, or a commit) exists.
	 */
	refExists( ref: string ): Promise<boolean>;

	/**
	 * Restores the files (relative to the repository root) to their content at the ref. A file that does not exist
	 * at the ref is deleted.
	 */
	restore( paths: Array<string>, ref: string ): Promise<void>;
};

/**
 * Opens the checkout that contains `cwd`. The checkout is prepared by whoever runs the framework: cloned, with
 * the dependencies installed, and with the base branch checked out. The framework never clones anything.
 * The `author` is needed only to commit.
 */
export async function openWorkspace( { cwd, author }: { cwd: string; author?: { name: string; email: string } } ): Promise<GitWorkspace> {
	const gitOptions = {
		config: [
			...( author ? [ `user.name=${ author.name }`, `user.email=${ author.email }` ] : [] ),
			// The commits are made by a bot. They must not depend on a signing setup of whoever runs it.
			'commit.gpgsign=false'
		]
	};

	let topLevel: string;

	try {
		topLevel = ( await simpleGit( { baseDir: cwd } ).revparse( [ '--show-toplevel' ] ) ).trim();
	} catch ( error ) {
		throw new Error( `"${ cwd }" is not inside a git repository.`, { cause: error } );
	}

	const path = upath.normalize( await realpath( topLevel ) );
	const git = simpleGit( { ...gitOptions, baseDir: path } );
	const branch = ( await git.revparse( [ '--abbrev-ref', 'HEAD' ] ) ).trim();
	const baseCommit = ( await git.revparse( [ 'HEAD' ] ) ).trim();

	let reportBranch: string | undefined;
	let needsForcePush = false;

	return {
		path,
		branch,
		originSlug: await getOriginSlug( git ),

		async assertPublishable() {
			if ( branch === 'HEAD' ) {
				throw new Error( 'Publishing needs a checked-out branch, but HEAD is detached. Check out the base branch first.' );
			}

			if ( ( await git.raw( [ 'rev-parse', '--is-shallow-repository' ] ) ).trim() === 'true' ) {
				throw new Error(
					'Publishing needs the full history of the checkout, but it is shallow. ' +
					'Configure the checkout in CI to fetch the whole history.'
				);
			}

			if ( ( await git.raw( [ 'status', '--porcelain' ] ) ).trim() ) {
				throw new Error( 'Publishing needs a clean working tree, but it has uncommitted changes. Commit or remove them first.' );
			}
		},

		async checkoutReportBranch( { name, continueExisting } ) {
			const existsRemotely = Boolean( ( await git.raw( [ 'ls-remote', '--heads', 'origin', name ] ) ).trim() );

			reportBranch = name;

			if ( !continueExisting || !existsRemotely ) {
				// A leftover branch of a merged or closed pull request is replaced. Nobody reviews it any more.
				needsForcePush = existsRemotely;

				await git.checkout( [ '-B', name, baseCommit ] );

				return;
			}

			needsForcePush = false;

			await git.fetch( 'origin', `+refs/heads/${ name }:refs/remotes/origin/${ name }` );
			await git.checkout( [ '-B', name, `origin/${ name }` ] );

			try {
				await git.merge( [ '--no-edit', '-m', `Merge ${ branch } into ${ name }.`, baseCommit ] );
			} catch ( error ) {
				await git.merge( [ '--abort' ] ).catch( () => {} );

				throw new Error(
					`Merging "${ branch }" into "${ name }" failed. Resolve the conflict in the report pull request by hand. ` +
					`Details: ${ ( error as Error ).message }`,
					{ cause: error }
				);
			}
		},

		async commit( paths, message ) {
			await git.add( [ '--all', '--', ...paths ] );

			if ( !( await git.diff( [ '--cached', '--name-only' ] ) ).trim() ) {
				return false;
			}

			await git.commit( message );

			return true;
		},

		async push() {
			await git.push( 'origin', reportBranch!, needsForcePush ? [ '--force' ] : [] );

			needsForcePush = false;
		},

		async returnToBase() {
			await git.raw( [ 'reset', '--hard', '--quiet' ] );
			await git.raw( [ 'clean', '-fd', '--quiet' ] );
			await git.checkout( branch );
		},

		async refExists( ref ) {
			// Without `--quiet`: simple-git treats a failure without an error message as a success.
			return succeeds( () => git.raw( [ 'rev-parse', '--verify', `${ ref }^{commit}` ] ) );
		},

		async restore( paths, ref ) {
			for ( const file of paths ) {
				if ( await succeeds( () => git.raw( [ 'cat-file', '-e', `${ ref }:${ file }` ] ) ) ) {
					await git.raw( [ 'checkout', ref, '--', file ] );
				} else {
					await git.raw( [ 'rm', '--cached', '--quiet', '--ignore-unmatch', '--', file ] );
					await rm( upath.join( path, file ), { force: true } );
				}
			}
		}
	};
}

// Supports the SSH (`git@github.com:owner/repo.git`) and the HTTPS (`https://github.com/owner/repo`) forms.
async function getOriginSlug( git: SimpleGit ): Promise<string | undefined> {
	const remotes = await git.getRemotes( true );
	const url = remotes.find( remote => remote.name === 'origin' )?.refs.fetch ?? '';

	return url.match( /github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/ )?.[ 1 ];
}

async function succeeds( command: () => Promise<unknown> ): Promise<boolean> {
	try {
		await command();

		return true;
	} catch {
		return false;
	}
}
