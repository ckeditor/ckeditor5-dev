/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { globSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import upath from 'upath';
import { parse, stringify } from 'yaml';
import type { Decision, Finding, PriorDecision } from '../types.js';

const REQUIRED_FIELDS = [ 'unit', 'rule', 'fragment', 'reason' ] as const;
const OPTIONAL_FIELDS = [ 'discriminator', 'finding' ] as const;

/**
 * Loads every decision file (`*.yml`) from the directory. A file that cannot be used does not stop
 * the run. It is skipped and reported as a warning, so the finding it was meant to reject is reported again.
 */
export async function loadDecisions( decisionsPath: string ): Promise<{ decisions: Array<Decision>; warnings: Array<string> }> {
	const files = globSync( '*.yml', { cwd: decisionsPath } );
	const decisions: Array<Decision> = [];
	const warnings: Array<string> = [];

	for ( const file of files.sort() ) {
		const content = await readFile( upath.join( decisionsPath, file ), 'utf8' );

		try {
			decisions.push( { file, ...parseDecision( content ) } );
		} catch ( error ) {
			warnings.push( `The "decisions/${ file }" decision file was skipped: ${ ( error as Error ).message.split( '\n' )[ 0 ] }` );
		}
	}

	return { decisions, warnings };
}

/**
 * Returns the decisions about the same claim as the finding: the same unit, rule and discriminator.
 */
export function findDecisions( decisions: Array<Decision>, finding: Pick<Finding, 'unit' | 'ruleId' | 'discriminator'> ): Array<Decision> {
	return decisions.filter( decision => {
		return decision.unit === finding.unit && decision.rule === finding.ruleId && decision.discriminator === finding.discriminator;
	} );
}

/**
 * Returns the decisions about the unit, each marked as expired or not. The harness hands them to `judge()`,
 * so a model reads the human reasoning, including the reasoning about content that has changed since.
 */
export function getPriorDecisions( decisions: Array<Decision>, unitKey: string, fragment: string ): Array<PriorDecision> {
	return decisions
		.filter( decision => decision.unit === unitKey )
		.map( ( { unit, rule, discriminator, fragment: decisionFragment, finding, reason } ) => ( {
			unit,
			rule,
			discriminator,
			fragment: decisionFragment,
			finding,
			reason,
			expired: decisionFragment !== fragment
		} ) );
}

function parseDecision( content: string ): Omit<Decision, 'file'> {
	// The failsafe schema keeps every scalar a string, so a hash such as `012345678901` is not read as a number.
	const decision: unknown = parse( content, { schema: 'failsafe' } );

	if ( !decision || typeof decision !== 'object' || Array.isArray( decision ) ) {
		throw new Error( 'It must contain a single YAML mapping.' );
	}

	const fields = decision as Record<string, unknown>;

	for ( const field of REQUIRED_FIELDS ) {
		if ( typeof fields[ field ] !== 'string' || fields[ field ].trim() === '' ) {
			throw new Error( `The "${ field }" field must be a non-empty string.` );
		}
	}

	for ( const field of OPTIONAL_FIELDS ) {
		if ( fields[ field ] !== undefined && typeof fields[ field ] !== 'string' ) {
			throw new Error( `The "${ field }" field must be a string.` );
		}
	}

	const text = ( field: string ) => ( ( fields[ field ] as string | undefined ) ?? '' ).trim();

	return {
		unit: text( 'unit' ),
		rule: text( 'rule' ),
		discriminator: text( 'discriminator' ),
		fragment: text( 'fragment' ),
		finding: text( 'finding' ),
		reason: text( 'reason' )
	};
}

/**
 * Renders the decision file that rejects the finding.
 */
export function renderDecision( finding: Finding, reason: string ): string {
	return stringify( {
		unit: finding.unit,
		rule: finding.ruleId,
		// An empty discriminator is left out. The YAML serializer skips `undefined` values.
		discriminator: finding.discriminator || undefined,
		fragment: finding.fragment,
		finding: finding.detail,
		reason
	}, { lineWidth: 0 } );
}

/**
 * Returns a readable file name, without the extension, for the decision about the finding, for example
 * `b2-docs-features-tables`.
 */
export function getDecisionFileName( { ruleId, unit, discriminator }: Pick<Finding, 'ruleId' | 'unit' | 'discriminator'> ): string {
	return [ ruleId, unit.replace( /\.md$/, '' ), discriminator ]
		.filter( Boolean )
		.join( '-' )
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-|-$/g, '' );
}
