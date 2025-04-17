/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import * as upath from 'upath';
import { expect } from 'vitest';
import type { TypeScript } from 'typedoc';
import type { ValidatorErrorCallbackArg } from '../lib/validators';

export const ROOT_TEST_DIRECTORY = upath.join( __dirname, '..', 'tests' );

export type ExpectedError = {
	identifier?: string;
	source: string;
};

export type ExpectedErrorNormalized = {
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

export function normalizeExpectedError(
	fixturesPath: string,
	messageCallback: ( identifier?: string ) => string
): ( expectedError: ExpectedError ) => ExpectedErrorNormalized {
	return ( expectedError: ExpectedError ) => {
		return {
			message: messageCallback( expectedError.identifier ),
			source: upath.join( fixturesPath, expectedError.source )
		};
	};
}

export function assertCalls( errorCalls: Array<ValidatorErrorCallbackArg>, expectedErrors: Array<ExpectedErrorNormalized> ): void {
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
