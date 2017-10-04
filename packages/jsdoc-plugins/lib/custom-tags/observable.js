/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const addMissingEventDoclets = require( '../observable-event-fixer/addmissingeventdoclets' );

module.exports = {
	// See http://usejsdoc.org/about-plugins.html#tag-definitions.
	defineTags( dictionary ) {
		dictionary.defineTag( 'observable', {
			mustNotHaveDescription: false,
			canHaveType: true,
			canHaveName: true,
			onTagged( doclet ) {
				doclet.observable = true;
			}
		} );
	},

	handlers: {
		processingComplete( e ) {
			e.doclets = addMissingEventDoclets( e.doclets );
		}
	}
};
