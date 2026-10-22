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
	 * Throws when the checkout cannot be published from: a detached `HEAD`, uncommitted changes, a shallow history,
	 * or ignored `paths` (relative to the repository root) that the run must commit. The environment that runs
	 * the framework must prepare the checkout correctly.
	 */
	assertPublishable( paths: Array<string> ): Promise<void>;

	/**
	 * Checks out a new report branch of a task, on top of the open report branches of its `stack`.
	 *
	 * The `stack` lists the branches of the open report pull requests of the task, from the bottom (based on the base
	 * branch) to the top. Each of them gets its parent merged in first: the base branch into the bottom one, then every
	 * branch into the next one. So the decisions and fixes merged to the base branch meanwhile are taken into account,
	 * and every pull request still shows only its own changes. A regular merge commit keeps review comments anchored.
	 * Then the new branch starts at the top of the stack, or at the base branch when the stack is empty.
	 */
	checkoutReportBranch( options: { name: string; stack: Array<string> } ): Promise<void>;

	/**
	 * Commits the given paths (relative to the repository root). Returns `false` when there was nothing to commit.
	 */
	commit( paths: Array<string>, message: string ): Promise<boolean>;

	/**
	 * Pushes the report branch with the credentials of the checkout, together with the branches of the stack that got
	 * a merge. The first push of a replaced report branch is forced, every later push is not.
	 */
	push(): Promise<void>;

	/**
	 * Drops anything a failed task left behind on the report branch and checks out the base branch again.
	 */
	returnToBase(): Promise<void>;

	/**
	 * Fetches the branches that exist on `origin` into their remote-tracking refs. Returns the names of those that exist
	 * there. It throws when `origin` cannot be reached.
	 */
	fetchBranches( names: Array<string> ): Promise<Array<string>>;

	/**
	 * Whether the ref (a branch, a remote branch, or a commit) exists.
	 */
	refExists( ref: string ): Promise<boolean>;

	/**
	 * Whether the commit of the `ref` is in the history of the `of` ref, for example because it was merged.
	 */
	isAncestor( ref: string, of: string ): Promise<boolean>;

	/**
	 * Whether any of the files (relative to the repository root) differs between the working tree and the ref.
	 */
	differsFrom( paths: Array<string>, ref: string ): Promise<boolean>;

	/**
	 * Whether any of the files (relative to the repository root) has uncommitted changes, or is untracked.
	 */
	hasChanges( paths: Array<string> ): Promise<boolean>;

	/**
	 * Restores the files (relative to the repository root) to their content at the ref. A file that does not exist
	 * at the ref is deleted.
	 */
	restore( paths: Array<string>, ref: string ): Promise<void>;
};

/**
 * Overrides of the commit author. Without them, the commits use the git configuration of the checkout: its author,
 * and its signing setup.
 */
export type CommitAuthor = {
	name?: string;
	email?: string;
};

/**
 * Opens the checkout that contains `cwd`. The checkout is prepared by whoever runs the framework: cloned, with
 * the dependencies installed, with the base branch checked out, and with the git configuration of the bot that commits.
 */
export async function openWorkspace( { cwd, author = {} }: { cwd: string; author?: CommitAuthor } ): Promise<GitWorkspace> {
	const allowEnvironment = getAllowedEnvironment();
	const gitOptions = {
		allowEnvironment,
		config: [
			...( author.name ? [ `user.name=${ author.name }` ] : [] ),
			...( author.email ? [ `user.email=${ author.email }` ] : [] )
		]
	};

	let topLevel: string;

	try {
		topLevel = ( await simpleGit( { allowEnvironment, baseDir: cwd } ).revparse( [ '--show-toplevel' ] ) ).trim();
	} catch ( error ) {
		throw new Error( `"${ cwd }" is not inside a git repository.`, { cause: error } );
	}

	const path = upath.normalize( await realpath( topLevel ) );
	const git = simpleGit( { ...gitOptions, baseDir: path } );
	const branch = ( await git.revparse( [ '--abbrev-ref', 'HEAD' ] ) ).trim();
	const baseCommit = ( await git.revparse( [ 'HEAD' ] ) ).trim();

	let reportBranch: string | undefined;
	// The commit of a leftover branch that the report branch replaces, so the push overwrites only that commit.
	let replacedCommit: string | undefined;
	let restackedBranches: Array<string> = [];

	return {
		path,
		branch,
		originSlug: await getOriginSlug( git ),

		async assertPublishable( paths ) {
			if ( branch === 'HEAD' ) {
				throw new Error( 'Publishing needs a checked-out branch, but HEAD is detached. Check out the base branch first.' );
			}

			if ( ( await git.raw( [ 'rev-parse', '--is-shallow-repository' ] ) ).trim() === 'true' ) {
				throw new Error(
					'Publishing needs the full history of the checkout, but it is shallow. ' +
					'Configure the checkout in CI to fetch the whole history.'
				);
			}

			// Without an explicit author, git would make one up from the user and the host name of the machine.
			for ( const key of [ 'user.name', 'user.email' ] ) {
				// simple-git resolves a failure without an error message, so a missing key reads as an empty value.
				if ( !( await git.raw( [ 'config', '--get', key ] ).catch( () => '' ) ).trim() ) {
					throw new Error(
						`Publishing needs the author of the commits, but \`${ key }\` is not set in the git configuration. ` +
						'Configure the git identity of the bot in the checkout, or set "AI_TASKS_GIT_NAME" and "AI_TASKS_GIT_EMAIL".'
					);
				}
			}

			if ( ( await git.raw( [ 'status', '--porcelain' ] ) ).trim() ) {
				throw new Error( 'Publishing needs a clean working tree, but it has uncommitted changes. Commit or remove them first.' );
			}

			// Without it, `git add` fails only after every task has run. Tracked paths are never reported as ignored.
			const ignored = paths.length ? ( await git.raw( [ 'check-ignore', '--', ...paths ] ) ).trim() : '';

			if ( ignored ) {
				throw new Error(
					'Publishing commits the state of the tasks, but a `.gitignore` file ignores it: ' +
					`${ ignored.split( '\n' ).join( ', ' ) }. Stop ignoring these paths first.`
				);
			}
		},

		async checkoutReportBranch( { name, stack } ) {
			let parent = baseCommit;
			let parentName = branch;

			reportBranch = name;
			restackedBranches = [];

			for ( const member of stack ) {
				await git.fetch( 'origin', `+refs/heads/${ member }:refs/remotes/origin/${ member }` );
				await git.checkout( [ '-B', member, `origin/${ member }` ] );

				const before = await git.revparse( [ 'HEAD' ] );

				try {
					await git.merge( [ '--no-edit', '-m', `Merge ${ parentName } into ${ member }.`, parent ] );
				} catch ( error ) {
					await git.merge( [ '--abort' ] ).catch( () => {} );

					throw new Error(
						`Merging "${ parentName }" into "${ member }" failed. Resolve the conflict in its report pull request by hand. ` +
						`Details: ${ ( error as Error ).message }`,
						{ cause: error }
					);
				}

				if ( await git.revparse( [ 'HEAD' ] ) !== before ) {
					restackedBranches.push( member );
				}

				parent = member;
				parentName = member;
			}

			// A leftover branch of a merged or closed pull request is replaced. Nobody reviews it any more.
			replacedCommit = ( await git.raw( [ 'ls-remote', '--heads', 'origin', name ] ) ).trim().split( /\s/ )[ 0 ] || undefined;

			await git.checkout( [ '-B', name, parent ] );
		},

		async commit( paths, message ) {
			await git.add( [ '--all', '--', ...paths ] );

			// Limited to the paths, so a file that a hook of a task staged by itself is not committed.
			if ( !( await git.diff( [ '--cached', '--name-only', '--', ...paths ] ) ).trim() ) {
				return false;
			}

			await git.raw( [ 'commit', '--quiet', '-m', message, '--', ...paths ] );

			return true;
		},

		async push() {
			// The parents first, so the pull request of the new branch never compares with an outdated parent.
			for ( const member of restackedBranches ) {
				await git.push( 'origin', member );
			}

			// A run that pushed the same branch meanwhile changed it, so the lease fails instead of overwriting that run.
			const lease = replacedCommit ? [ `--force-with-lease=refs/heads/${ reportBranch }:${ replacedCommit }` ] : [];

			await git.push( 'origin', reportBranch!, lease );

			restackedBranches = [];
			replacedCommit = undefined;
		},

		async returnToBase() {
			await git.raw( [ 'reset', '--hard', '--quiet' ] );
			await git.raw( [ 'clean', '-fd', '--quiet' ] );
			await git.checkout( branch );
		},

		async fetchBranches( names ) {
			const heads = ( await git.raw( [ 'ls-remote', '--heads', 'origin', ...names.map( name => `refs/heads/${ name }` ) ] ) )
				.split( '\n' )
				.map( line => line.split( '\t' )[ 1 ] );
			const existing = names.filter( name => heads.includes( `refs/heads/${ name }` ) );

			if ( existing.length ) {
				const refspecs = existing.map( name => `+refs/heads/${ name }:refs/remotes/origin/${ name }` );

				await git.raw( [ 'fetch', '--quiet', 'origin', ...refspecs ] );
			}

			return existing;
		},

		async refExists( ref ) {
			// Without `--quiet`: simple-git treats a failure without an error message as a success.
			return succeeds( () => git.raw( [ 'rev-parse', '--verify', `${ ref }^{commit}` ] ) );
		},

		async isAncestor( ref, of ) {
			// Not `merge-base --is-ancestor`: it answers with the exit code only, which simple-git does not report.
			const mergeBase = await git.raw( [ 'merge-base', ref, of ] ).catch( () => '' );

			return mergeBase.trim() === ( await git.revparse( [ ref ] ) ).trim();
		},

		async differsFrom( paths, ref ) {
			return Boolean( ( await git.raw( [ 'diff', '--name-only', ref, '--', ...paths ] ) ).trim() );
		},

		async hasChanges( paths ) {
			return Boolean( ( await git.raw( [ 'status', '--porcelain', '--', ...paths ] ) ).trim() );
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

/**
 * Returns the environment variables that git can get from the process. simple-git 4 removes all other `GIT_*`
 * variables from the environment of git. `GIT_CONFIG_GLOBAL` and `GIT_CONFIG_NOSYSTEM` select the configuration
 * files, and the tests use them to isolate git. The other variables give the credentials of the checkout to
 * `ls-remote`, `fetch` and `push`.
 */
function getAllowedEnvironment(): Array<string> {
	return [
		'GIT_CONFIG_GLOBAL',
		'GIT_CONFIG_NOSYSTEM',
		'GIT_ASKPASS',
		'SSH_ASKPASS',
		'GIT_TERMINAL_PROMPT',
		'GIT_SSH',
		'GIT_SSH_COMMAND',
		'GIT_SSH_VARIANT',
		// The names of `GIT_CONFIG_KEY_<n>` and `GIT_CONFIG_VALUE_<n>` contain a number, so they come from the environment.
		...Object.keys( process.env ).filter( name => /^GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+)$/i.test( name ) )
	];
}

/**
 * Returns the GitHub slug of `origin`. Supports the SSH (`git@github.com:owner/repo.git`) and the HTTPS
 * (`https://github.com/owner/repo`) forms.
 */
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
