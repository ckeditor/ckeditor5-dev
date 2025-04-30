/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReflectionKind,
	type Context,
	type Application,
	type DeclarationReflection
} from 'typedoc';
import { getNode } from '../../utils/index.js';
import { type ValidatorErrorCallback } from '../index.js';
import { getPluginPriority } from '../../utils/getpluginpriority.js';

const AUGMENTATION_MODULE_REGEXP = /[^\\/]+[\\/]src[\\/]augmentation/;

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if the module name matches the path to the file where the module is defined.
 */
export default function( app: Application, onError: ValidatorErrorCallback ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd( onError ), getPluginPriority( 'validators' ) );
}

function onEventEnd( onError: ValidatorErrorCallback ) {
	return ( context: Context ) => {
		const reflections = context.project.getReflectionsByKind( ReflectionKind.Module ) as Array<DeclarationReflection>;

		for ( const reflection of reflections ) {
			// The augmentation module does not contain the `@module` annotation. We need to skip it.
			if ( reflection.name.match( AUGMENTATION_MODULE_REGEXP ) ) {
				continue;
			}

			const [ packageName, ...moduleName ] = reflection.name.split( '/' );

			// If there is no module name after the package name, skip it.
			if ( !moduleName.length ) {
				continue;
			}

			const node = getNode( context, reflection );

			// Not a ES6 module.
			if ( !node ) {
				continue;
			}

			const filePath = node.getSourceFile().fileName;

			if ( filePath.endsWith( 'src/augmentation.ts' ) ) {
				continue;
			}

			const expectedFilePath = `ckeditor5-${ packageName }/src/${ moduleName.join( '/' ) }.ts`;

			if ( !filePath.endsWith( expectedFilePath ) ) {
				onError( `Invalid module name: "${ reflection.name }"`, node );
			}
		}
	};
}
