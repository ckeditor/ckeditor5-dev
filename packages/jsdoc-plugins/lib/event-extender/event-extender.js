/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
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
