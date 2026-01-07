#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Extracts base URL from the provided page URL. Base URL consists of a protocol, a host, a port, and a path.
 * A hash and search parts are omitted, because they would have navigated to the same page if they were set.
 */
export function getBaseUrl( url: string ): string {
	const { origin, pathname } = new URL( url );

	return `${ origin }${ pathname }`;
}

/**
 * Checks, if provided string is a valid URL utilizing the HTTP or HTTPS protocols.
 */
export function isUrlValid( url: string ): boolean {
	try {
		return [ 'http:', 'https:' ].includes( new URL( url ).protocol );
	} catch {
		return false;
	}
}

/**
 * Transforms any value to an array. If the provided value is already an array, it is returned unchanged.
 */
export function toArray( data: any ): Array<any> {
	return Array.isArray( data ) ? data : [ data ];
}
