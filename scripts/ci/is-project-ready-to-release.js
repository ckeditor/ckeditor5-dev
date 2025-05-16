#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import * as releaseTools from '@ckeditor/ckeditor5-dev-release-tools';

const changelogVersion = releaseTools.getLastFromChangelog();
const npmTag = releaseTools.getNpmTagFromVersion( changelogVersion );

// As long as CKEditor 5 supports the old installation methods, to avoid breaking the existing configurations,
// packages from `ckeditor5-dev` are released as `@next`.
const temporaryTagToCheck = npmTag === 'latest' ? 'next' : npmTag;

releaseTools.isVersionPublishableForTag( '@ckeditor/ckeditor5-dev-release-tools', changelogVersion, temporaryTagToCheck )
	.then( result => {
		if ( !result ) {
			console.error( `The proposed changelog (${ changelogVersion }) version is not higher than the already published one.` );
			process.exit( 1 );
		} else {
			console.log( 'The project is ready to release.' );
		}
	} );

