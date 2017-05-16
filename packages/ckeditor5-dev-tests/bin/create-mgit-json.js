#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const cwd = process.cwd();
const packageJson = require( path.join( cwd, 'package.json' ) );
const mgitJson = path.resolve( cwd, 'mgit.json' );

const json = {
	'dependencies': {}
};

let deps = [];

if ( packageJson.dependencies ) {
	deps = Object.keys( packageJson.dependencies );
}

if ( packageJson.devDependencies ) {
	deps = deps.concat( Object.keys( packageJson.devDependencies ) );
}

if ( deps.length ) {
	deps.forEach( item => {
		if ( !item.startsWith( '@ckeditor/ckeditor5' ) ) {
			return;
		}

		if ( item.includes( '/ckeditor5-dev' ) ) {
			return;
		}

		json.dependencies[ item ] = item.slice( 1 );
	} );

	fs.writeFileSync( mgitJson, JSON.stringify( json, null, 2 ) + '\n', 'utf-8' );
}
