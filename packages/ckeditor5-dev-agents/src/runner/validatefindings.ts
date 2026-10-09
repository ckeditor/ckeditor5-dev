/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { hash as hashText } from 'node:crypto';
import { hash } from '../utils/text.js';
import type { Finding, Task, TaskUnit } from '../types.js';

// The fields the harness sets or validates. Any other field a judge returns is stored as it is.
const KNOWN_FIELDS = [
	'fingerprint', 'id', 'task', 'unit', 'ruleId', 'discriminator', 'detail', 'fragment', 'path', 'reportedAt', 'previousDecision', 'fix'
];

/**
 * Returns the identity of a finding. Two findings with the same fingerprint are the same claim,
 * so the harness reports it only once.
 */
export function getFingerprint(
	{ task, unit, ruleId, discriminator }: Pick<Finding, 'task' | 'unit' | 'ruleId' | 'discriminator'>
): string {
	return [ task, unit, ruleId, discriminator ].map( part => part.replace( /[\\|]/g, '\\$&' ) ).join( '|' );
}

/**
 * Returns the full digest of a fingerprint. Its first 12 characters are the `id` of the finding. Longer prefixes
 * resolve collisions between IDs.
 */
export function getFindingId( fingerprint: string ): string {
	return hashText( 'sha256', fingerprint, 'hex' );
}

/**
 * Checks what `judge()` returned and turns it into findings the harness can store.
 * It throws when anything is malformed, because a judge that half-worked must not advance the baseline.
 */
export function validateFindings(
	findings: unknown,
	{ task, unit, fragment }: { task: Pick<Task, 'id' | 'ruleIds'>; unit: TaskUnit; fragment: string }
): Array<Finding> {
	if ( !Array.isArray( findings ) ) {
		throw new Error( '`judge()` must return an array of findings.' );
	}

	return findings.map( ( finding: unknown, index ) => {
		if ( !finding || typeof finding !== 'object' || Array.isArray( finding ) ) {
			throw new Error( `Finding #${ index } must be an object.` );
		}

		const fields = finding as Record<string, unknown>;

		if ( typeof fields.ruleId !== 'string' || !task.ruleIds.includes( fields.ruleId ) ) {
			throw new Error( `Finding #${ index } refers to the unknown "${ String( fields.ruleId ) }" rule.` );
		}

		if ( typeof fields.detail !== 'string' || fields.detail.trim() === '' ) {
			throw new Error( `Finding #${ index } must have a non-empty "detail".` );
		}

		if ( fields.discriminator !== undefined && typeof fields.discriminator !== 'string' ) {
			throw new Error( `The "discriminator" of finding #${ index } must be a string.` );
		}

		const extraFields = Object.fromEntries( Object.entries( fields ).filter( ( [ key ] ) => !KNOWN_FIELDS.includes( key ) ) );
		const identity = {
			task: task.id,
			unit: unit.key,
			ruleId: fields.ruleId,
			discriminator: fields.discriminator ?? ''
		};

		const fingerprint = getFingerprint( identity );

		return {
			fingerprint,
			id: hash( fingerprint ),
			...identity,
			detail: fields.detail.trim(),
			fragment,
			...( unit.path ? { path: unit.path } : {} ),
			...extraFields
		};
	} );
}
