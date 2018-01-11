#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const cwd = process.cwd();
const lerna = path.resolve( cwd, 'lerna.json' );

const json = {
	'lerna': '2.0.0-rc.1',
	'packages': [
		'packages/*',
		'.'
	],
	'hoist': true,
	'commands': {
		'bootstrap': {
			'concurrency': 1
		}
	}
};

fs.writeFileSync( lerna, JSON.stringify( json, null, 2 ) + '\n', 'utf-8' );
