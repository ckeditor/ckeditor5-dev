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

const mainRepoUrl = 'https://github.com/ckeditor/ckeditor5';
const revisionBranch = `${ branch }-revisions`;

// Clone the repository.
exec( `git clone -b ${ revisionBranch } ${ mainRepoUrl }.git` );

// Change current dir to cloned repository.
process.chdir( path.join( process.cwd(), 'ckeditor5' ) );

// Install Mgit.
exec( 'npm install -g mgit2' );

// Get the latest `mgit.json`.
exec( `git checkout origin/${ branch } .` );

// Install dependencies.
exec( 'mgit bootstrap --recursive --resolver-url-template="https://github.com/\\\${ path }.git"' );

// Save hashes from all dependencies.
exec( 'mgit save-hashes' );

exec( 'git add mgit.json' );

const repository = process.env.TRAVIS_REPO_SLUG;
const commit = process.env.TRAVIS_COMMIT;
const commitMessage = `Revision: https://github.com/${ repository }/commit/${ commit }`;

// Check whether any of the files have changed. It might happen that none has changed if a build was restarted
// or two builds were running at the same time.
if ( exec( 'git status -s' ).trim().length ) {
	exec( `git add mgit.json && git commit -m "${ commitMessage }"` );

	exec( `echo "https://${ process.env.GITHUB_TOKEN }:@github.com" > .git/credentials 2> /dev/null` );
	exec( 'git config credential.helper "store --file=.git/credentials"' );

	exec( `git push origin ${ revisionBranch } --quiet` );

	const lastCommit = exec( 'git log -1 --format="%h"' );
	console.log( `Successfully saved the revision under ${ mainRepoUrl }/commit/${ lastCommit }` );
}

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}
