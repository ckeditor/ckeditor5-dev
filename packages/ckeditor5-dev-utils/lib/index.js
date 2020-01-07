/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	git: require( './git' ),
	logger: require( './logger' ),
	tools: require( './tools' ),
	stream: require( './stream' ),
	workspace: require( './workspace' ),
	translations: require( './translations/index' ),
	bundler: require( './bundler/index' ),
	styles: require( './styles/index' )
};
