/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const createSpinner = require( './tools/createspinner' );

module.exports = {
	createSpinner,

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
	shExec( command, options = {} ) {
		const {
			verbosity = 'info',
			cwd = process.cwd(),
			async = false
		} = options;

		const logger = require( './logger' );
		const log = logger( verbosity );
		const sh = require( 'shelljs' );

		sh.config.silent = true;

		const execOptions = { cwd };

		if ( async ) {
			return new Promise( ( resolve, reject ) => {
				sh.exec( command, execOptions, ( code, stdout, stderr ) => {
					try {
						const result = execHandler( code, stdout, stderr );

						resolve( result );
					} catch ( err ) {
						reject( err );
					}
				} );
			} );
		}

		const { code, stdout, stderr } = sh.exec( command, execOptions );

		return execHandler( code, stdout, stderr );

		function execHandler( code, stdout, stderr ) {
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
	},

	/**
	 * Returns array with all directories under specified path.
	 *
	 * @param {String} path
	 * @returns {Array}
	 */
	getDirectories( path ) {
		const fs = require( 'fs' );
		const pth = require( 'path' );

		const isDirectory = path => {
			try {
				return fs.statSync( path ).isDirectory();
			} catch ( e ) {
				return false;
			}
		};

		return fs.readdirSync( path ).filter( item => {
			return isDirectory( pth.join( path, item ) );
		} );
	},

	/**
	 * Updates JSON file under specified path.
	 * @param {String} path Path to file on disk.
	 * @param {Function} updateFunction Function that will be called with parsed JSON object. It should return
	 * modified JSON object to save.
	 */
	updateJSONFile( path, updateFunction ) {
		const fs = require( 'fs' );

		const contents = fs.readFileSync( path, 'utf-8' );
		let json = JSON.parse( contents );
		json = updateFunction( json );

		fs.writeFileSync( path, JSON.stringify( json, null, 2 ) + '\n', 'utf-8' );
	}
};
