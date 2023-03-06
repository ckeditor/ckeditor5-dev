/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { ReflectionKind } = require( 'typedoc' );
const { utils } = require( '@ckeditor/typedoc-plugins' );

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if the module name matches the path to the file where the module is defined.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError A callback that is executed when a validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const reflections = project.getReflectionsByKind( ReflectionKind.Module );

	for ( const reflection of reflections ) {
		const [ packageName, ...moduleName ] = reflection.name.split( '/' );

		// If there is no module name after the package name, skip it.
		if ( !moduleName.length ) {
			continue;
		}

		const filePath = utils.getNode( reflection ).fileName;
		const expectedFilePath = `ckeditor5-${ packageName }/src/${ moduleName.join( '/' ) }.ts`;

		if ( !filePath.endsWith( expectedFilePath ) ) {
			onError( `Invalid module name: "${ reflection.name }"`, reflection );
		}
	}
};
