/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import sh from 'shelljs';
import logger, { type Verbosity } from '../logger/index.js';

type ShExecOptions = {

	/**
	 * Level of the verbosity. If set as 'info' both outputs (stdout and stderr) will be logged.
	 * If set as 'error', only stderr output will be logged.
	 */
	verbosity?: Verbosity;

	cwd?: string;

	/**
	 * If set, the command execution is asynchronous. The execution is synchronous by default.
	 */
	async?: boolean;
};

export default function shExec( command: string, options: { async: true } & ShExecOptions ): Promise<string>;
export default function shExec( command: string, options?: ( { async?: false } & ShExecOptions ) ): string;

export default function shExec( command: string, options: ShExecOptions = {} ): string | Promise<string> {
	const {
		verbosity = 'info',
		cwd = process.cwd(),
		async = false
	} = options;

	sh.config.silent = true;

	const execOptions = { cwd };

	if ( async ) {
		return new Promise( ( resolve, reject ) => {
			sh.exec( command, execOptions, ( code, stdout, stderr ) => {
				try {
					const result = execHandler( { code, stdout, stderr, verbosity, command } );

					resolve( result );
				} catch ( err ) {
					reject( err );
				}
			} );
		} );
	}

	const { code, stdout, stderr } = sh.exec( command, execOptions );

	return execHandler( { code, stdout, stderr, verbosity, command } );
}

function execHandler(
	{ code, stdout, stderr, verbosity, command }: { code: number; stdout: string; stderr: string; verbosity: Verbosity; command: string }
): string {
	const log = logger( verbosity );
	const grey = chalk.grey;

	if ( code ) {
		if ( stdout ) {
			log.error( grey( stdout ) );
		}

		if ( stderr ) {
			log.error( grey( stderr ) );
		}

		throw new Error( `Error while executing ${ command }: ${ stderr }` );
	}

	if ( stdout ) {
		log.info( grey( stdout ) );
	}

	if ( stderr ) {
		log.info( grey( stderr ) );
	}

	return stdout;
}
