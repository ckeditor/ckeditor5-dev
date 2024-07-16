#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

const releaseTools = require( '@ckeditor/ckeditor5-dev-release-tools' );
const { name: packageName } = require( '@ckeditor/ckeditor5-dev-release-tools/package.json' );

const changelogVersion = releaseTools.getLastFromChangelog();
const npmTag = releaseTools.getNpmTagFromVersion( changelogVersion );

releaseTools.isVersionPublishable( packageName, changelogVersion, npmTag )
	.then( result => {
		if ( !result ) {
			console.error( `The proposed changelog (${ changelogVersion }) version is not higher than the already published one.` );
			process.exit( 1 );
		} else {
			console.log( 'The project is ready to release.' );
		}
	} );

