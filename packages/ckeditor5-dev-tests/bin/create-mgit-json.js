#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const createMgitJson = require( '../lib/bin/createmgitjsoncontent' );

const cwd = process.cwd();
const packageJson = require( path.join( cwd, 'package.json' ) );
const mgitJsonPath = path.join( cwd, 'mgit.json' );

const mgitJson = createMgitJson( packageJson );

fs.writeFileSync( mgitJsonPath, JSON.stringify( mgitJson, null, 2 ) + '\n', 'utf-8' );
