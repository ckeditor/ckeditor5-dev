/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const minimist = require( 'minimist' );
const statusTask = require( './tasks/status' );
const initTask = require( './tasks/init' );
const installTask = require( './tasks/install' );
const pluginCreateTask = require( './tasks/create-package' );
const updateTask = require( './tasks/update' );
const relinkTask = require( './tasks/relink' );
const execTask = require( './tasks/exec' );
const { log } = require( 'ckeditor5-dev-utils' );
const path = require( 'path' );

module.exports = ( config ) => {
	const cwd = process.cwd();
	const packageJSON = require( path.join( cwd, 'package.json' ) );
	const tasks = {
		updateRepositories() {
			const options = minimist( process.argv.slice( 2 ), {
				boolean: [ 'npm-update' ],
				default: {
					'npm-update': false
				}
			} );

			return updateTask( installTask, cwd, packageJSON, config.WORKSPACE_DIR, options[ 'npm-update' ] );
		},

		checkStatus() {
			return statusTask( cwd, packageJSON, config.WORKSPACE_DIR );
		},

		initRepository() {
			return initTask( installTask, cwd, packageJSON, config.WORKSPACE_DIR );
		},

		createPackage( done ) {
			pluginCreateTask( cwd, config.WORKSPACE_DIR )
				.then( done )
				.catch( ( error ) => done( error ) );
		},

		relink() {
			return relinkTask( cwd, packageJSON, config.WORKSPACE_DIR );
		},

		installPackage() {
			const options = minimist( process.argv.slice( 2 ), {
				string: [ 'package' ],
				default: {
					plugin: ''
				}
			} );

			if ( options.package ) {
				return installTask( cwd, config.WORKSPACE_DIR, options.package );
			} else {
				throw new Error( 'Please provide a package to install: gulp dev-install --plugin <path|GitHub URL|name>' );
			}
		},

		execOnRepositories() {
			// Omit `gulp exec` part of arguments
			const params = minimist( process.argv.slice( 3 ), {
				stopEarly: false,
			} );
			let task;

			try {
				if ( params.task ) {
					task = require( `./tasks/exec/functions/${ params.task }` );
				} else {
					throw new Error( 'Missing task parameter: --task task-name' );
				}
			} catch ( err ) {
				log.err( err );

				return;
			}

			return execTask( task, cwd, packageJSON, config.WORKSPACE_DIR, params );
		}
	};

	return tasks;
};
