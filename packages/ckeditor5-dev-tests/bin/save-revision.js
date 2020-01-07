#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const branch = process.env.TRAVIS_BRANCH;
const buildType = process.env.TRAVIS_EVENT_TYPE;

// Save revision only when commit has made directly on the "master" branch.
if ( branch !== 'master' || buildType !== 'push' ) {
	process.exit();
}

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const mainRepoUrl = 'https://github.com/ckeditor/ckeditor5';
const revisionBranch = `${ branch }-revisions`;

// Clone the repository.
exec( `git clone ${ mainRepoUrl }.git` );

// Change current dir to cloned repository.
process.chdir( path.join( process.cwd(), 'ckeditor5' ) );

// And check out to the revision branch.
exec( `git checkout ${ revisionBranch } ` );

// Install Mr. Git.
exec( 'npm install -g mrgit' );

// Sync the revision branch with the master.
exec( `git checkout ${ branch } -- .` );

// Remove all files from "staged".
exec( 'git reset -q .' );

// Install dependencies.
exec( 'mrgit sync --recursive --resolver-url-template="https://github.com/\\${ path }.git"' );

// Save hashes from all dependencies.
exec( 'mrgit save --hash' );

// Add all files (perhaps the changes from master will be committed).
exec( 'git add .' );

const repository = process.env.TRAVIS_REPO_SLUG;
const commit = process.env.TRAVIS_COMMIT;
const commitMessage = `Revision: https://github.com/${ repository }/commit/${ commit }`;

// Check whether any of the files have changed. It might happen that none has changed if a build was restarted
// or two builds were running at the same time.
if ( exec( 'git status -s' ).trim().length ) {
	exec( `git commit -m "${ commitMessage }"` );

	exec( `echo "https://${ process.env.GITHUB_TOKEN }:@github.com" > .git/credentials 2> /dev/null` );
	exec( 'git config credential.helper "store --file=.git/credentials"' );

	exec( `git push origin ${ revisionBranch } --quiet` );

	const lastCommit = exec( 'git log -1 --format="%h"' );
	console.log( `Successfully saved the revision under ${ mainRepoUrl }/commit/${ lastCommit }` );
} else {
	console.log( 'Nothing to commit. The revision log is up to date.' );
}

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}
