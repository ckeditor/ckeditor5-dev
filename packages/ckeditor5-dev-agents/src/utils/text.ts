/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { hash as hashText } from 'node:crypto';
import { decodeHTMLStrict } from 'entities';

// The length of a short hash: the `id` of a finding and the hashes stored in the baseline and the decision files.
const HASH_LENGTH = 12;

const CHARACTERS: Record<string, string> = {
	'‘': '\'',
	'’': '\'',
	'‚': '\'',
	'‛': '\'',
	'′': '\'',
	'“': '"',
	'”': '"',
	'„': '"',
	'‟': '"',
	'″': '"',
	'‐': '-',
	'‑': '-',
	'‒': '-',
	'–': '-',
	'—': '-',
	'―': '-',
	'−': '-',
	'…': '...'
};

const CHARACTERS_PATTERN = new RegExp( `[${ Object.keys( CHARACTERS ).join( '' ) }]`, 'g' );

/**
 * Normalises prose by folding HTML entities, typographic quotes and dashes, and whitespace.
 * Use only when these differences are irrelevant to the audit; whitespace and entities can be significant in code.
 */
export function normalise( text: string ): string {
	return decodeHTMLStrict( text )
		.replace( CHARACTERS_PATTERN, character => CHARACTERS[ character ]! )
		.replace( /\s+/g, ' ' )
		.trim();
}

/**
 * Returns a short, stable hash of a text. It is what the baseline and the decision files store.
 */
export function hash( text: string ): string {
	return hashText( 'sha256', text, 'hex' ).slice( 0, HASH_LENGTH );
}
