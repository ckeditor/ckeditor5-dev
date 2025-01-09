/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import sh from 'shelljs';
import logger from '../logger/index.js';

/**
 * Executes a shell command.
 *
 * @param {string} command The command to be executed.
 * @param {object} options
 * @param {'info'|'warning'|'error'|'silent'} [options.verbosity='info'] Level of the verbosity. If set as 'info'
 * both outputs (stdout and stderr) will be logged. If set as 'error', only stderr output will be logged.
 * @param {string} [options.cwd=process.cwd()]
 * @param {boolean} [options.async=false] If set, the command execution is asynchronous. The execution is synchronous by default.
 * @returns {string|Promise.<string>} The command output.
 */
export default function shExec( command, options = {} ) {
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

/**
 * @param {object} options
 * @param {number} options.code
 * @param {string} options.stdout
 * @param {string} options.stderr
 * @param {'info'|'warning'|'error'|'silent'} options.verbosity
 * @param {string} options.command
 * @returns {string}
 */
function execHandler( { code, stdout, stderr, verbosity, command } ) {
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
