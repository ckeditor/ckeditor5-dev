/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { spawnSync } from 'node:child_process';

export interface UpgradeDependencyOptions {

	/**
	 * Updates dependencies to their latest stable versions (may update ranges).
	 */
	latest?: boolean;

	/**
	 * How deep dependencies should be inspected.
	 */
	depth?: number | 'Infinity';

	/**
	 * Run update across all workspace packages.
	 */
	recursive?: boolean;

	/**
	 * Whether to print the output to the console or silence it.
	 */
	verbose?: boolean;
}

/**
 * Upgrades dependencies in a project using `pnpm update` command.
 *
 * @param packages An array of package names to upgrade.
 * @param options Additional options.
 * @returns The exit code of the `pnpm` process.
 */
export function upgradeDependency(
	packages: Array<string>,
	options: UpgradeDependencyOptions = {}
): number {
	const normalizedOptions = {
		latest: false,
		depth: 'Infinity',
		recursive: true,
		verbose: false,
		...options
	} satisfies UpgradeDependencyOptions;

	const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
	const args = getUpdateArgs( packages, normalizedOptions );

	const result = spawnSync( command, args, {
		cwd: process.cwd(),
		stdio: normalizedOptions.verbose ? 'inherit' : 'pipe',
		encoding: 'utf8'
	} );

	return result.status ?? 1;
}

/**
 * Creates arguments for the `pnpm update` command based on provided packages and options.
 *
 * @param packages An array of package names to upgrade.
 * @param options Additional options.
 * @returns An array of arguments for the `pnpm update` command.
 */
function getUpdateArgs(
	packages: Array<string>,
	options: UpgradeDependencyOptions
): Array<string> {
	const args: Array<string> = [ 'update' ];

	if ( options.depth !== undefined ) {
		args.push( '--depth', String( options.depth ) );
	}

	if ( options.recursive ) {
		args.push( '--recursive' );
	}

	if ( options.latest ) {
		args.push( '--latest' );
	}

	args.push( ...packages );

	return args;
}
