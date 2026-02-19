/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync, globSync } from 'node:fs';
import { isolatedDeclaration } from 'oxc-transform';
import path from 'upath';

const declarationExtensions = new Set( [ '.mts', '.cts' ] );

function getTypeScriptSourceFiles( directoryPath ) {
	const sourceFileNames = globSync( '**/*.{ts,tsx,mts,cts}', {
		cwd: directoryPath,
		ignore: [ '**/*.d.ts', '**/*.d.mts', '**/*.d.cts' ]
	} );

	return sourceFileNames.map( file => path.join( directoryPath, file ) );
}

function getDeclarationFileName( sourceFileName ) {
	const { dir, name, ext } = path.parse( sourceFileName );
	const declarationExtension = declarationExtensions.has( ext ) ? ext : '.ts';

	return path.join( dir, `${ name }.d${ declarationExtension }` );
}

export function declarationFilesPlugin() {
	const sourceDirectoryPath = path.join( process.cwd(), 'src' );

	return {
		name: 'emit-declaration-files',

		async generateBundle() {
			const sourceFilePaths = getTypeScriptSourceFiles( sourceDirectoryPath );

			await Promise.all( sourceFilePaths.map( async sourceFilePath => {
				const filename = path.relative( sourceDirectoryPath, sourceFilePath );
				const source = readFileSync( sourceFilePath, 'utf8' );
				const { errors, code } = await isolatedDeclaration( filename, source, {
					sourcemap: false,
					stripInternal: true
				} );

				if ( errors.length ) {
					const errorMessage = errors
						.map( error => [ error.message, error.codeframe ].filter( Boolean ).join( '\n' ) )
						.join( '\n\n' );

					this.error( `Could not generate a declaration file for "${ filename }".\n${ errorMessage }` );
				}

				this.emitFile( {
					type: 'asset',
					fileName: getDeclarationFileName( filename ),
					source: code
				} );
			} ) );
		}
	};
}
