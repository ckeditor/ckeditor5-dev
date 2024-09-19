/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = upath.dirname( __filename );

export const PACKAGES_DIRECTORY = 'packages';
export const RELEASE_DIRECTORY = 'release';
export const CKEDITOR5_DEV_ROOT = upath.join( __dirname, '..', '..' );
