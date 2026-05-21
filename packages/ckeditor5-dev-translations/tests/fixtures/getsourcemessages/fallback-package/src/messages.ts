/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export function collectMessages( this: { t: ( message: string ) => string } ): void {
	const t = this.t;

	t( 'Fallback translation' );
}
