#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const branch = 'master'; // process.env.TRAVIS_BRANCH;

if ( branch !== 'master' ) {
	process.exit();
}

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const executeOnDependencies = require( '@ckeditor/ckeditor5-dev-env/lib/release-tools/utils/executeondependencies' );

const mainBranch = `${ branch }-revisions`;

// Clone the repository.
// jscs:disable maximumLineLength
exec( `git clone -b ${ mainBranch } https://${ process.env.GITHUB_USER }:${ process.env.GITHUB_PASSWORD }@github.com/ckeditor/ckeditor5.git` );
// jscs:enable maximumLineLength

const cwd = path.join( process.cwd(), 'ckeditor5' );
const mgitJsonPath = path.join( cwd, 'mgit.json' );
const mgitJson = require( mgitJsonPath );
const depsHashes = {};

const execDepsOptions = {
	cwd,
	workspace: mgitJson.packages
};

// Change current dir to cloned repository.
process.chdir( cwd );

// Install Mgit
exec( 'npm install -g mgit2' );

// Install dependencies.
// jscs:disable maximumLineLength
exec( 'mgit bootstrap --recursive --resolver-url-template="https://github.com/\\\${ path }.git"' );
// jscs:enable maximumLineLength

// Checkout out each package to master.
exec( `mgit exec "git checkout ${ branch }"` );

// Get hashes from all dependencies
executeOnDependencies( execDepsOptions, functionToExecute )
	.then( () => {
		tools.updateJSONFile( mgitJsonPath, ( json ) => {
			for ( const packageName of Object.keys( depsHashes ) ) {
				let packageRepo = packageName;

				if ( packageRepo.startsWith( '@' ) ) {
					packageRepo = packageName.slice( 1 );
				}

				json.dependencies[ packageName ] = packageRepo + '#' + depsHashes[ packageName ];
			}

			return json;
		} );

		const commitMessage = `[${ process.env.TRAVIS_REPO_SLUG }] Updated hashes.`;

		if ( exec( 'git diff --name-only' ).trim().length ) {
			exec( `git add mgit.json && git commit -m "${ commitMessage } "` );
			exec( `git push origin ${ mainBranch }` );
		}
	} )
	.catch( ( err ) => {
		process.exitCode = 1;

		console.log( err );
	} );

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}

function functionToExecute( dependencyName, dependencyPath ) {
	process.chdir( dependencyPath );

	depsHashes[ dependencyName ] = exec( 'git rev-parse HEAD' ).trim();

	return Promise.resolve();
}
