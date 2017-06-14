#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

// Build the documentation only when master branch is updated.
if ( process.env.TRAVIS_BRANCH !== 'master' ) {
	process.exit();
}

// Build the documentation only when CRON triggered the CI.
// if ( process.env.TRAVIS_EVENT_TYPE !== 'cron' ) {
// 	process.exit();
// }

const path = require( 'path' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const mainRepoUrl = 'https://github.com/CKEditor5/ckeditor5.github.io';

// Install required dependencies for building the documentation.
exec( 'npm run install-optional-dependencies' );

// Clone te CKEditor 5 page.
exec( `git clone ${ mainRepoUrl }.git` );

// Build the documentation.
exec( 'gulp docs' );

// Remove existing documentation.
exec( 'rm -rf ckeditor5.github.io/docs/nightly/*' );

// Make sure that the destination directory is available.
exec( 'mkdir -p ckeditor5.github.io/docs/nightly' );

// Copy built documentation to the new destination.
exec( 'cp -R build/docs/* ckeditor5.github.io/docs/nightly' );

// Change work directory in order to make a commit in CKEditor 5 page's repository.
process.chdir( path.join( process.cwd(), 'ckeditor5.github.io' ) );

exec( `echo "https://${ process.env.GITHUB_TOKEN }:@github.com" > .git/credentials 2> /dev/null` );
exec( 'git config credential.helper "store --file=.git/credentials"' );

// Commit the documentation.
exec( 'git add docs/' );
exec( 'git commit -m "Documentation build."' );
exec( 'git push origin master --quiet' );

const lastCommit = exec( 'git log -1 --format="%h"' );
console.log( `Successfully published the documentation under ${ mainRepoUrl }/commit/${ lastCommit }` );

function exec( command ) {
	return tools.shExec( command, { verbosity: 'error' } );
}
