#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

import { buildProject } from '../dist/index.js';

try {
	await buildProject();

	process.exit( 0 );
} catch( error ) {
	console.log( 'The build process failed with the following error:' );
	console.log( error );

	process.exit( 1 );
}
