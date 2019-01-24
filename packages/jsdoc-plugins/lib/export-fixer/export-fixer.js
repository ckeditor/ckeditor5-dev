/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = {
	handlers: {
		/**
		 * @see http://usejsdoc.org/about-plugins.html#event-beforeparse
		 * @param evt
		 */
		beforeParse( evt ) {
			// See https://github.com/ckeditor/ckeditor5-design/blob/jsdoc-module-test/jsdoc/plugins/export-fix.js
			// and the contents of that branch for better understanding of wht these replacements do.

			evt.source = evt.source.replace( /(\n\t*)export default class /, '$1class ' );

			evt.source = evt.source.replace( /(\n\t*)export class /g, '$1class ' );

			evt.source = evt.source.replace( /(\n\t*)export default function /, '$1export function ' );
		}
	}
};
