/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { expect } from 'vitest';
import type { TypeScript } from 'typedoc';
import type { ValidatorErrorCallbackArg } from '../src/validators/index.js';

export const ROOT_TEST_DIRECTORY = upath.join( import.meta.dirname, '..', 'tests' );

export type ExpectedError = {
	message: string;
	source: string;
};

/**
 * Returns the source file path with line number from a TypeScript node.
 */
export function getSource( node: TypeScript.Declaration | null ): string {
	if ( !node ) {
		return '(Unknown file)';
	}

	const sourceFile = node.getSourceFile();
	const { line } = sourceFile.getLineAndCharacterOfPosition( node.getStart() );

	return `${ sourceFile.fileName }:${ line + 1 }`;
}

export function assertCalls( errorCalls: Array<ValidatorErrorCallbackArg>, expectedErrors: Array<ExpectedError> ): void {
	expect( errorCalls.length ).toEqual( expectedErrors.length );

	for ( const call of errorCalls ) {
		const [ message, node ] = call;

		expect( call ).toSatisfy( () => {
			return expectedErrors.some( error => {
				if ( message !== error.message ) {
					return false;
				}

				if ( getSource( node ) !== error.source ) {
					return false;
				}

				return true;
			} );
		}, `Unexpected "${ message }" error received.` );
	}
}
