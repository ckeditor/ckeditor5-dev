/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = ( workspaceRelativePath ) => {
	const cwd = process.cwd();
	const path = require( 'path' );
	const packageJSON = require( path.join( cwd, 'package.json' ) );
	const tasks = {
		updateRepositories() {
			const updateTask = require( './tasks/update' );
			const installTask = require( './tasks/install' );
			const minimist = require( 'minimist' );
			const options = minimist( process.argv.slice( 2 ), {
				boolean: [ 'npm-update' ],
				default: {
					'npm-update': false
				}
			} );

			return updateTask( installTask, cwd, packageJSON, workspaceRelativePath, options[ 'npm-update' ] );
		},

		checkStatus() {
			const statusTask = require( './tasks/status' );

			return statusTask( cwd, packageJSON, workspaceRelativePath );
		},

		initRepository() {
			const initTask = require( './tasks/init' );
			const installTask = require( './tasks/install' );

			return initTask( installTask, cwd, packageJSON, workspaceRelativePath );
		},

		createPackage( done ) {
			const packageCreateTask = require( './tasks/create-package' );
			packageCreateTask( cwd, workspaceRelativePath )
				.then( done )
				.catch( ( error ) => done( error ) );
		},

		relink() {
			const relinkTask = require( './tasks/relink' );

			return relinkTask( cwd, packageJSON, workspaceRelativePath );
		},

		installPackage() {
			const installTask = require( './tasks/install' );
			const minimist = require( 'minimist' );
			const options = minimist( process.argv.slice( 2 ), {
				string: [ 'package' ],
				default: {
					plugin: ''
				}
			} );

			if ( options.package ) {
				return installTask( cwd, workspaceRelativePath, options.package );
			} else {
				throw new Error( 'Please provide a package to install: --package <path|GitHub URL|name>' );
			}
		},

		execOnRepositories() {
			const execTask = require( './tasks/exec' );
			const minimist = require( 'minimist' );
			const { log } = require( 'ckeditor5-dev-utils' );
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

			return execTask( task, cwd, packageJSON, workspaceRelativePath, params );
		}
	};

	return tasks;
};
