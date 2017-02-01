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

const mainBranch = `${ branch }-revisions`;

// Clone the repository.
// jscs:disable maximumLineLength
exec( `git clone -b ${ mainBranch } https://${ process.env.GITHUB_USER }:${ process.env.GITHUB_PASSWORD }@github.com/ckeditor/ckeditor5.git` );
// jscs:enable maximumLineLength

// Change current dir to cloned repository.
process.chdir( path.join( process.cwd(), 'ckeditor5' ) );

// Install Mgit.
exec( 'npm install -g mgit2' );

// Install dependencies.
// jscs:disable maximumLineLength
exec( 'mgit bootstrap --recursive --resolver-url-template="https://github.com/\\\${ path }.git"' );
// jscs:enable maximumLineLength

// Checkout out each package to master.
exec( `mgit exec "git checkout ${ branch }"` );

// Save hashes from all dependencies.
exec( 'mgit save-hashes' );

const commitMessage = `[${ process.env.TRAVIS_REPO_SLUG }] Updated hashes.`;

// Check whether the mgit.json has changed.
if ( exec( 'git diff --name-only mgit.json' ).trim().length ) {
	exec( `git add mgit.json && git commit -m "${ commitMessage } "` );
	exec( `git push origin ${ mainBranch }` );
}

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}
