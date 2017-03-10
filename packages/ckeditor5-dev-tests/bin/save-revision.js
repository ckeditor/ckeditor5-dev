#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const branch = process.env.TRAVIS_BRANCH;

// Save revision only when master branches are updated.
if ( branch !== 'master' ) {
	process.exit();
}

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const mainBranch = `${ branch }-revisions`;

// Clone the repository.
exec(
	`git clone -b ${ mainBranch } ` +
	`https://${ process.env.GITHUB_USER }:${ process.env.GITHUB_PASSWORD }@github.com/ckeditor/ckeditor5.git`
);

// Change current dir to cloned repository.
process.chdir( path.join( process.cwd(), 'ckeditor5' ) );

// Install Mgit.
exec( 'npm install -g mgit2' );

// Install dependencies.
exec( 'mgit bootstrap --recursive --resolver-url-template="https://github.com/\\\${ path }.git"' );

// Checkout out each package to master.
exec( `mgit exec "git checkout ${ branch }"` );

// Save hashes from all dependencies.
exec( 'mgit save-hashes' );

const commitMessage = `[${ process.env.TRAVIS_REPO_SLUG }] Updated hashes.`;

// Check whether the mgit.json has changed. It might not have changed if, e.g., a build was restarted.
if ( exec( 'git diff --name-only mgit.json' ).trim().length ) {
	exec( `git add mgit.json && git commit -m "${ commitMessage }"` );
	exec( `git push origin ${ mainBranch }` );
}

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}
