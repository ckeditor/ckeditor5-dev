/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = {
	handlers: {
		/**
		 * @see http://usejsdoc.org/about-plugins.html#event-newdoclet
		 * @param evt
		 */
		newDoclet( evt ) {
			const { doclet } = evt;

			if ( doclet.kind !== 'event' ) {
				return;
			}

			if ( !doclet.params ) {
				doclet.params = [];
			}

			doclet.params.unshift( {
				type: {
					names: [
						'module:utils/eventinfo~EventInfo'
					]
				},
				description: '<p>An object containing information about the fired event.</p>',
				name: 'eventInfo'
			} );
		}
	}
};
