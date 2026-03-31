/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import url from 'node:url';
import { spawn } from 'node:child_process';

/**
 * Runs the Snyk CLI through `pnpm exec` and resolves only for explicitly allowed exit codes.
 * This lets callers tolerate Snyk's non-zero "findings present" codes when a snapshot should still be published.
 *
 * @param {Array<string>} snykArguments CLI arguments passed to `snyk`.
 * @param {Array<number>} [allowedExitCodes=[ 0 ]] Exit codes treated as successful.
 * @returns {Promise<void>}
 */
export default function runSnykCommand( snykArguments, allowedExitCodes = [ 0 ] ) {
	const snykExecutablePath = url.fileURLToPath( import.meta.resolve( 'snyk/bin/snyk' ) );
	const pnpmFlags = process.env.DEBUG ? [] : [ '--silent' ];

	return new Promise( ( resolve, reject ) => {
		const childProcess = spawn( 'pnpm', [ ...pnpmFlags, 'exec', snykExecutablePath, ...snykArguments ], {
			cwd: process.cwd(),
			stdio: 'inherit',
			shell: process.platform === 'win32'
		} );

		childProcess.on( 'error', reject );
		childProcess.on( 'close', exitCode => {
			if ( allowedExitCodes.includes( exitCode ) ) {
				resolve();

				return;
			}

			reject( new Error( `Snyk command failed with exit code ${ exitCode }.` ) );
		} );
	} );
}
