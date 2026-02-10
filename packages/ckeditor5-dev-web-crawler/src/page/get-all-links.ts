/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/// <reference lib="dom" />

/**
 * Returns all links on the page.
 *
 * This function is in a separate file to allow using DOM APIs thanks to TypeScript
 * and eslint magic comments above.
 */
export function getAllLinks( ignoreAttribute: string ): Array<string> {
	return Array
		// Get all links from the document.
		.from( document.links )

		// Filter out links with the given attribute, downloads and protocols other than http(s).
		.filter( link =>
			link.href &&
			!link.hasAttribute( ignoreAttribute ) &&
			!link.hasAttribute( 'download' ) &&
			/^https?:$/.test( link.protocol )
		)

		// Convert to absolute URL.
		.map( link => link.origin + link.pathname )

		// Remove duplicates.
		.filter( ( link, index, array ) => array.indexOf( link ) === index );
}
