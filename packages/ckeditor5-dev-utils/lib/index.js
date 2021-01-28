/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
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
	builds: require( './builds/index' ),
	styles: require( './styles/index' )
};
