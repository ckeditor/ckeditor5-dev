/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { ParsedFile } from '../types.js';

export function isEntryValid( entry: ParsedFile, packagesNames: Array<string>, organisationNamespace: string ): boolean {
	const packagesNamesNoNamespace = packagesNames.map( packageName => packageName.replace( `${ organisationNamespace }/`, '' ) );
	const expectedTypes = [ 'Feature', 'Fix', 'Other' ];

	if ( !expectedTypes.includes( entry.data.type ) ) {
		return false;
	}

	if ( !entry.data.scope.every( scope => packagesNamesNoNamespace.includes( scope ) ) ) {
		return false;
	}

	return true;
}
