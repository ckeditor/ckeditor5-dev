/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { type Context, TypeScript } from 'typedoc';
import { type ValidatorErrorCallback } from '../index.js';

/**
 * Validates that classes are not re-exported as type-only exports.
 *
 * A type-only export (`export type { Foo }` or `export { type Foo }`) strips the class to its structural type,
 * causing TypeDoc to treat it as an interface instead of a class in the generated API documentation.
 */
export default function( context: Context, onError: ValidatorErrorCallback ): void {
	const program = context.program;
	const checker = program.getTypeChecker();

	for ( const sourceFile of program.getSourceFiles() ) {
		if ( sourceFile.isDeclarationFile ) {
			continue;
		}

		TypeScript.forEachChild( sourceFile, node => {
			if ( !TypeScript.isExportDeclaration( node ) ) {
				return;
			}

			const exportDeclaration = node as TypeScript.ExportDeclaration;

			if ( !exportDeclaration.exportClause || !TypeScript.isNamedExports( exportDeclaration.exportClause ) ) {
				return;
			}

			for ( const specifier of exportDeclaration.exportClause.elements ) {
				if ( !isTypeOnlyExportSpecifier( exportDeclaration, specifier ) ) {
					continue;
				}

				const symbol = checker.getExportSpecifierLocalTargetSymbol( specifier );

				if ( !symbol ) {
					continue;
				}

				if ( !isClassSymbol( symbol, checker ) ) {
					continue;
				}

				const exportedName = specifier.name.text;
				const localName = specifier.propertyName?.text || exportedName;

				const message = [
					`Class "${ localName }"`,
					localName !== exportedName && `(exported as "${ exportedName }")`,
					'must not be exported as a type-only export.'
				].filter( Boolean ).join( ' ' );

				onError( message, specifier as unknown as TypeScript.Declaration );
			}
		} );
	}
}

function isTypeOnlyExportSpecifier(
	exportDeclaration: TypeScript.ExportDeclaration,
	specifier: TypeScript.ExportSpecifier
): boolean {
	// `export type { Foo }` — the entire declaration is type-only.
	if ( exportDeclaration.isTypeOnly ) {
		return true;
	}

	// `export { type Foo }` — per-specifier type-only modifier.
	if ( specifier.isTypeOnly ) {
		return true;
	}

	return false;
}

function isClassSymbol( symbol: TypeScript.Symbol, checker: TypeScript.TypeChecker ): boolean {
	// Resolve aliases (e.g., `export type { Foo } from './foo'` where Foo is re-exported through intermediaries).
	const resolvedSymbol = symbol.flags & TypeScript.SymbolFlags.Alias ? checker.getAliasedSymbol( symbol ) : symbol;

	if ( !resolvedSymbol.declarations ) {
		return false;
	}

	return resolvedSymbol.declarations.some( declaration =>
		TypeScript.isClassDeclaration( declaration ) &&
		!( TypeScript.getCombinedModifierFlags( declaration ) & TypeScript.ModifierFlags.Ambient )
	);
}
