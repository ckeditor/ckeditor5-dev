/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Plugin } from 'vite';

const SOURCE_FILE_REGEXP = /\.[cm]?[jt]sx?$/;

export function ckDebugPlugin(): Plugin {
	const debugFlags = getDebugFlags( process.env.CK_DEBUG );

	return {
		name: 'ck-debug',
		enforce: 'pre',
		transform: {
			filter: {
				id: {
					include: SOURCE_FILE_REGEXP
				}
			},
			handler( code ) {
				if ( !code.includes( '// @if ' ) ) {
					return null;
				}

				const transformedCode = code.replace(
					/(^[ \t]*)\/\/ @if (!?[\w]+) \/\/(.*)$/gm,
					( match, indentation: string, flagName: string, body: string ) => {
						if ( !debugFlags.has( flagName ) ) {
							return match;
						}

						return `${ indentation }/* @if ${ flagName } */${ body }`;
					}
				);

				return transformedCode === code ? null : transformedCode;
			}
		}
	};
}

function getDebugFlags( debugOption?: string ): Set<string> {
	if ( !debugOption || debugOption === 'false' ) {
		return new Set();
	}

	return new Set( [
		'CK_DEBUG',
		...debugOption.split( ',' )
			.map( flag => flag.trim() )
			.filter( Boolean )
			.map( flag => `CK_DEBUG_${ flag.toUpperCase() }` )
	] );
}
