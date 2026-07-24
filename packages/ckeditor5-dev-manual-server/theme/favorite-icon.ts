/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const FAVORITE_ICON_PATH = 'M8 1.5l1.94 3.93 4.34.63-3.14 3.06.74 4.32L8 11.4l-3.88 2.04.74-4.32-3.14-3.06 4.34-.63L8 1.5z';

/**
 * Creates the favorite star icon used by the catalog and manual test header.
 */
export function createFavoriteIcon( className: string ): SVGSVGElement {
	const icon = document.createElementNS( SVG_NAMESPACE, 'svg' );
	const path = document.createElementNS( SVG_NAMESPACE, 'path' );

	icon.classList.add( className );
	icon.setAttribute( 'viewBox', '0 0 16 16' );
	icon.setAttribute( 'width', '16' );
	icon.setAttribute( 'height', '16' );
	icon.setAttribute( 'aria-hidden', 'true' );
	path.setAttribute( 'd', FAVORITE_ICON_PATH );
	icon.append( path );

	return icon;
}
