#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const cwd = process.cwd();
const lerna = path.resolve( cwd, 'lerna.json' );

let json = {
	'lerna': '2.0.0-beta.32',
	'packages': [
		'packages/*',
		'.'
	],
	'version': '0.0.0'
};

fs.writeFileSync( lerna, JSON.stringify( json, null, 2 ) + '\n', 'utf-8' );
