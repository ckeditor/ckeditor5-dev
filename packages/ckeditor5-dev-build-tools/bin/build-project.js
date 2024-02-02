#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

import chalk from 'chalk';
import { buildProject } from '../dist/index.js';

try {
	await buildProject();

	process.exit( 0 );
} catch( error ) {
	if ( error.name === 'RollupError' ) {
		console.log( chalk.red( chalk.bold( 'ERROR:' ) + `Error occured when processing the file "${ error.id }".` ) );
		console.log( error.message );
		console.log( error.frame );
	} else {
		console.log( chalk.red( chalk.bold( 'ERROR:' ) + 'The build process failed with the following error:' ) );
		console.log( error.message );
	}

	process.exit( 1 );
}
