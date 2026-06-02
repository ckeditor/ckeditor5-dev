/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { globSync, readFileSync } from 'node:fs';
import path from 'upath';
import { isolatedDeclaration } from 'oxc-transform';
import type { Plugin } from 'rolldown';

export interface RolldownDeclarationOptions {

	/**
	 * Directory containing TypeScript source files.
	 */
	sourceDirectory: string;

	/**
	 * Whether to skip declarations for internal APIs (marked with `@internal` in the source code).
	 *
	 * @default true
	 */
	stripInternal?: boolean;
}

const declarationExtensions = new Set( [ '.mts', '.cts' ] );

/**
 * Returns TypeScript source files that should have matching declaration files emitted.
 */
function getTypeScriptSourceFiles( directoryPath: string ): Array<string> {
	const sourceFileNames = globSync( '**/*.{ts,tsx,mts,cts}', {
		cwd: directoryPath,
		exclude: [ '**/*.d.ts', '**/*.d.mts', '**/*.d.cts' ]
	} );

	return sourceFileNames.map( file => path.join( directoryPath, file ) );
}

/**
 * Returns declaration file name for a TypeScript source file.
 */
function getDeclarationFileName( sourceFileName: string ): string {
	const { dir, name, ext } = path.parse( sourceFileName );
	const declarationExtension = declarationExtensions.has( ext ) ? ext : '.ts';

	return path.join( dir, `${ name }.d${ declarationExtension }` );
}

/**
 * Generates declaration files using isolated declarations.
 */
export function declarationFiles( pluginOptions: RolldownDeclarationOptions ): Plugin {
	const {
		sourceDirectory,
		stripInternal = true
	} = pluginOptions;

	return {
		name: 'emit-declaration-files',

		async generateBundle() {
			const sourceFilePaths = getTypeScriptSourceFiles( sourceDirectory );

			const declarationFiles = await Promise.all( sourceFilePaths.map( async sourceFilePath => {
				const filename = path.relative( sourceDirectory, sourceFilePath );
				const source = readFileSync( sourceFilePath, 'utf8' );
				const { errors, code } = await isolatedDeclaration( filename, source, {
					sourcemap: false,
					stripInternal
				} );

				return {
					fileName: getDeclarationFileName( filename ),
					filename,
					errors,
					source: code
				};
			} ) );

			const errorMessages = declarationFiles
				.filter( declarationFile => declarationFile.errors.length )
				.map( declarationFile => {
					const errors = declarationFile.errors
						.map( error => [ error.message, error.codeframe ].filter( Boolean ).join( '\n' ) )
						.join( '\n\n' );

					return `Could not generate a declaration file for "${ declarationFile.filename }".\n${ errors }`;
				} );

			if ( errorMessages.length ) {
				this.error( errorMessages.join( '\n\n' ) );
			}

			for ( const declarationFile of declarationFiles ) {
				this.emitFile( {
					type: 'asset',
					fileName: declarationFile.fileName,
					source: declarationFile.source
				} );
			}
		}
	};
}
