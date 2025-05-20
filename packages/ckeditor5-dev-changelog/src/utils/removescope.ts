/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';

export function removeScope( parsedChangesetFiles: Array<ParsedFile> ): Array<ParsedFile> {
	const clone: Array<ParsedFile> = JSON.parse( JSON.stringify( parsedChangesetFiles ) );

	clone.forEach( changeset => delete changeset.data.scope );
	clone.forEach( changeset => delete changeset.data.scopeNormalized );

	return clone;
}
