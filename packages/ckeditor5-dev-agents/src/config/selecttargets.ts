/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Target } from '../types.js';

/**
 * Returns the targets to run in a checkout of the `originSlug` repository: the named ones, or every target of
 * the repository. A checkout belongs to one repository, so only the targets of that repository can run in it.
 */
export function selectTargets(
	targets: Map<string, Target>,
	{ originSlug, names, taskIds }: { originSlug: string | undefined; names: Array<string>; taskIds: Array<string> }
): Array<Target> {
	for ( const name of names ) {
		if ( !targets.has( name ) ) {
			throw new Error( `The "${ name }" target does not exist. Available targets: ${ [ ...targets.keys() ].join( ', ' ) }.` );
		}
	}

	const origin = originSlug ?? 'an unknown repository';
	const selected = names.length ? names.map( name => targets.get( name )! ) :
		[ ...targets.values() ].filter( target => target.slug === originSlug );

	for ( const target of selected ) {
		if ( target.slug !== originSlug ) {
			throw new Error( `The "${ target.name }" target is for "${ target.slug }", but the checkout is a clone of ${ origin }.` );
		}
	}

	if ( !selected.length ) {
		throw new Error( `No target is configured for the checkout, which is a clone of ${ origin }.` );
	}

	for ( const taskId of taskIds ) {
		if ( !selected.some( target => target.tasks.has( taskId ) ) ) {
			throw new Error( `The "${ taskId }" task is not configured in any of the selected targets.` );
		}
	}

	return selected;
}
