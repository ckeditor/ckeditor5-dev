/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const utils = require( './utils' );

module.exports = {
	pluginEventInheritanceFixer: require.resolve( './event-inheritance-fixer' ),
	pluginEventParamFixer: require.resolve( './event-param-fixer' ),
	pluginInterfaceAugmentationFixer: require.resolve( './interface-augmentation-fixer' ),
	pluginModuleFixer: require.resolve( './module-fixer' ),
	pluginPurgePrivateApiDocs: require.resolve( './purge-private-api-docs' ),
	pluginSymbolFixer: require.resolve( './symbol-fixer' ),
	pluginTagError: require.resolve( './tag-error' ),
	pluginTagEvent: require.resolve( './tag-event' ),
	pluginTagObservable: require.resolve( './tag-observable' ),
	utils
};
