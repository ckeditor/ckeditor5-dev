/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global CKEditorInspector, window */

/*
 * This script attaches the inspector (https://github.com/ckeditor/ckeditor5-inspector) to
 * all editors created in manual tests and referred under the global `window.editor` property.
 */
( () => {
	let editor = null;

	Object.defineProperty( window, 'editor', {
		set: value => {
			editor = value;

			if ( editor ) {
				CKEditorInspector.attach( editor );
			}
		},
		get: () => editor
	} );
} )();

