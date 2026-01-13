#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import { styleText } from 'node:util';
import fs from 'fs-extra';
import { globSync } from 'glob';

const cwd = process.cwd();
const coverageFile = path.join( cwd, 'coverage', 'lcov.info' );

fs.emptyDirSync( path.join( coverageFile, '..' ) );
fs.ensureFileSync( path.join( coverageFile ) );

// Merge separate reports into a single file that would be sent to Codecov.
for ( const lcovPath of globSync( './packages/*/coverage/lcov.info' ) ) {
	const relativePackagePath = path.join( lcovPath, '..', '..' );
	const content = fs.readFileSync( lcovPath, 'utf-8' )
		.replaceAll( /^(SF:)/gm, `$1${ relativePackagePath }/` );

	fs.writeFileSync( coverageFile, content, { flag: 'as' } );
}

console.log( styleText( 'cyan', `Coverage status stored in "${ styleText( 'underline', coverageFile ) }".` ) );
