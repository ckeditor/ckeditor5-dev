/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import type { Target } from '../types.js';

// Tasks and state use paths relative to the target root, which may be a subdirectory, for example `projects/cs`.
export function getBlobUrl( target: Pick<Target, 'root' | 'slug'>, branch: string, path: string ): string {
	return `https://github.com/${ target.slug }/blob/${ encodePath( branch ) }/${ encodePath( upath.join( target.root, path ) ) }`;
}

export function getHistoryUrl( target: Pick<Target, 'root' | 'slug'>, branch: string, path: string ): string {
	return `https://github.com/${ target.slug }/commits/${ encodePath( branch ) }/${ encodePath( upath.join( target.root, path ) ) }`;
}

function encodePath( path: string ): string {
	return path.split( '/' ).map( encodeURIComponent ).join( '/' );
}
