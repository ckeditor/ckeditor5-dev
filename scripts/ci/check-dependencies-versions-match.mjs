/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { checkVersionMatch } from '../../packages/ckeditor5-dev-dependency-checker/lib/index.js';

const shouldFix = process.argv[ 2 ] === '--fix';

const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..', '..' );

checkVersionMatch( {
	cwd: ROOT_DIRECTORY,
	fix: shouldFix
} );
