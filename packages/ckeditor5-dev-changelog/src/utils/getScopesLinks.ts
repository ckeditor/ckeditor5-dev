/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { NPM_URL } from '../constants.js';

export function getScopesLinks( scope: Array<string>, organisationNamespace: string, packagePrefix: string ): string {
	const getShortName = ( packageName: string ) => packageName.replace( packagePrefix, '' );

	return scope
		?.map( packageName => `[${ getShortName( packageName ) }](${ NPM_URL }/${ organisationNamespace }/${ packageName })` )
		.join( ', ' );
}
