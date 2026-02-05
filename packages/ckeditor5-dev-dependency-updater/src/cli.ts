/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseArgs } from 'node:util';
import { upgradeDependency } from './upgrader.js';

/**
 * CLI entry point for the dependency upgrader.
 *
 * Arguments:
 *   * --latest - Updates dependencies to their latest stable versions (may update ranges). Default: false.
 *   * --depth <number|Infinity> - How deep dependencies should be inspected. Default: Infinity.
 *   * --recursive - Run update across all workspace packages. Use `--no-recursive` to disable. Default: true.
 *
 * Example usage:
 *   ckeditor5-dev-dependency-updater vite
 *       # Upgrades `vite` to the latest version allowed by the current range.
 *
 *   ckeditor5-dev-dependency-updater vite --latest
 *       # Upgrades `vite` to the latest stable version (may update the range).
 *
 *   ckeditor5-dev-dependency-updater vite --depth 0
 *       # Upgrades `vite` only if it's a direct dependency (no deep inspection).
 *
 *   ckeditor5-dev-dependency-updater vite --no-recursive
 *       # Runs update only in the current working directory (no workspace recursion).
 *
 * @returns The exit code of the process.
 */
export async function runCli(): Promise<number> {
	const { values, positionals } = parseArgs( {
		allowPositionals: true,
		allowNegative: true,
		strict: true,
		options: {
			latest: {
				type: 'boolean',
				default: false
			},
			depth: {
				type: 'string',
				default: 'Infinity'
			},
			recursive: {
				type: 'boolean',
				default: true
			}
		}
	} );

	const { latest, depth, recursive } = values;
	const packages = positionals.map( pkg => pkg.trim() ).filter( Boolean );

	return upgradeDependency( packages, {
		depth: /^\d+$/.test( depth ) ? Number( depth ) : depth as 'Infinity',
		latest,
		recursive,
		verbose: true
	} );
}
