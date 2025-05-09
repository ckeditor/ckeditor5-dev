/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types';

export function removeScope( parsedChangesetFiles: Array<ParsedFile> ): void {
	return parsedChangesetFiles.forEach( changeset => delete changeset.data.scope );
}
