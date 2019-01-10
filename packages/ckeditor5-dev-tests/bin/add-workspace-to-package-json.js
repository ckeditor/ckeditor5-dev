#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const cwd = process.cwd();
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

tools.updateJSONFile( path.join( cwd, 'package.json' ), json => {
	json.private = true;
	json.workspaces = [
		'packages/*'
	];

	return json;
} );

