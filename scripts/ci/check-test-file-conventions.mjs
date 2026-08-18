/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { CKEDITOR5_DEV_ROOT } from '../utils/constants.js';
import { findTestFileConventionViolations, formatViolations } from '../utils/testfileconventions.js';

const report = formatViolations( await findTestFileConventionViolations( CKEDITOR5_DEV_ROOT ) );

if ( report ) {
	console.error( 'Test file conventions are not met.\n' );
	console.error( report );

	process.exit( 1 );
}

console.log( 'All test files follow the naming and location conventions.' );
