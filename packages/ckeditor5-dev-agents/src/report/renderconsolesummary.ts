/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { TargetResult } from '../runtasks.js';
import type { TaskResult } from '../runner/runtarget.js';
import { inline } from '../utils/strings.js';

const LABEL_WIDTH = 15;

/**
 * Renders what a run did, as plain text for the console: one block per task of every target.
 */
export function renderConsoleSummary( targets: Array<TargetResult> ): string {
	const blocks = targets.flatMap( target => {
		const heading = `${ target.target } (${ target.branch })`;

		if ( target.error ) {
			return [ [ `${ heading } · failed`, row( 'Error', inline( target.error ) ) ].join( '\n' ) ];
		}

		if ( !target.results.length ) {
			return [ `${ heading } · no enabled tasks` ];
		}

		return target.results.map( result => renderTask( result, `${ heading } · ${ target.publish ? 'published' : 'local' }` ) );
	} );

	return blocks.join( '\n\n' );
}

function renderTask( result: TaskResult, heading: string ): string {
	const lines = [ `${ result.title } · ${ heading }` ];
	const { summary, failure } = result;

	if ( !summary ) {
		lines.push( row( 'Failed', inline( failure! ) ), row( 'Time', formatDuration( result.durationMs ) ) );

		return lines.join( '\n' );
	}

	const problems = [
		...( failure ? [ `Publishing failed: ${ inline( failure ) }` ] : [] ),
		...summary.problems.map( ( { unit, message } ) => inline( unit ? `${ unit }: ${ message }` : message ) )
	];

	lines.push(
		row( 'Units', `${ summary.units } in scope · ${ summary.changed } changed · ${ summary.judged } judged` +
			( summary.deferred ? ` · ${ summary.deferred } left for the next runs` : '' ) ),
		row( 'Findings', `${ summary.newFindings } new · ${ summary.alreadyOpen } already open · ${ summary.rejected } rejected` ),
		row( 'Fixes', `${ summary.fixed } fixed · ${ summary.discarded } discarded` ),
		row( 'Files', `${ summary.changedFiles } changed` ),
		row( 'Open', String( summary.open ) ),
		row( 'Cost', `$${ summary.cost.toFixed( 2 ) } · ${ summary.tokens } tokens · ${ formatDuration( result.durationMs ) }` ),
		row( 'Problems', problems.length ? String( problems.length ) : 'none' ),
		...problems.map( problem => row( '', `• ${ problem }` ) )
	);

	if ( result.pullRequestUrl ) {
		lines.push( row( 'Pull request', result.pullRequestUrl ) );
	}

	return lines.join( '\n' );
}

function row( label: string, value: string ): string {
	return `  ${ label.padEnd( LABEL_WIDTH - 2 ) }${ value }`;
}

function formatDuration( milliseconds: number ): string {
	// Rounded before splitting, so a duration just below a full minute does not show as "60 s".
	const tenths = Math.round( milliseconds / 100 );

	if ( tenths < 600 ) {
		return `${ ( tenths / 10 ).toFixed( 1 ) } s`;
	}

	const seconds = Math.round( milliseconds / 1000 );

	return `${ Math.floor( seconds / 60 ) } min ${ seconds % 60 } s`;
}
