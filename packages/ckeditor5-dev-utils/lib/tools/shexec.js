/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import sh from 'shelljs';
import logger from '../logger/index.js';

/**
 * Executes a shell command.
 *
 * @param {String} command The command to be executed.
 * @param {Object} options
 * @param {'info'|'warning'|'error'|'silent'} [options.verbosity='info'] Level of the verbosity. If set as 'info'
 * both outputs (stdout and stderr) will be logged. If set as 'error', only stderr output will be logged.
 * @param {String} [options.cwd=process.cwd()]
 * @param {Boolean} [options.async=false] If set, the command execution is asynchronous. The execution is synchronous by default.
 * @returns {String|Promise.<String>} The command output.
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
 * @param {Object} options
 * @param {Number} options.code
 * @param {String} options.stdout
 * @param {String} options.stderr
 * @param {'info'|'warning'|'error'|'silent'} options.verbosity
 * @param {String} options.command
 * @returns {String}
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
