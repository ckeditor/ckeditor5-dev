/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { TypeScript } from 'typedoc';
import * as upath from 'upath';

export const ROOT_DIRECTORY = upath.join( __dirname, '..' );
export const ROOT_TEST_DIRECTORY = upath.join( ROOT_DIRECTORY, 'tests' );

/**
 * Returns the source file path with line number from a TypeScript node.
 */
export function getSource( node: TypeScript.Declaration | null ): string {
	if ( !node ) {
		return '(Unknown file)';
	}

	const sourceFile = node.getSourceFile();
	const fileName = upath.basename( sourceFile.fileName );
	const position = node.getStart();
	const { line } = sourceFile.getLineAndCharacterOfPosition( position );

	return `${ fileName }:${ line + 1 }`;
}
