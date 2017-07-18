#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const createMgitJsonContent = require( '../lib/bin/createmgitjsoncontent' );

const cwd = process.cwd();

const packageJsonBody = fs.readFileSync( path.join( cwd, 'package.json' ) ).toString();
const packageJson = JSON.parse( packageJsonBody );

const mgitJsonPath = path.join( cwd, 'mgit.json' );
const mgitJson = createMgitJsonContent( packageJson );

fs.writeFileSync( mgitJsonPath, JSON.stringify( mgitJson, null, 2 ) + '\n', 'utf-8' );
