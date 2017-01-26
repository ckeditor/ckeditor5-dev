/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	git: require( './git' ),
	logger: require( './logger' ),
	tools: require( './tools' ),
	stream: require( './stream' ),
	workspace: require( './workspace' ),
	getAllTranslations: require( './translations/getalltranslations' ),
	replaceFunctionCalls: require( './replacefunctioncalls' )
};
