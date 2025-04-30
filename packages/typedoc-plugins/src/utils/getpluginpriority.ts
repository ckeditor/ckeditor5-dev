/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Do not use `import * as plugins from '../index.js';` to avoid circular dependency.
const pluginGroups = [
	[
		'typeDocRestoreProgramAfterConversion'
	],
	[
		'typeDocModuleFixer',
		'typeDocSymbolFixer',
		'typeDocReferenceFixer'
	],
	[
		'typeDocTagObservable',
		'typeDocTagError',
		'typeDocTagEvent'
	],
	[
		'typeDocEventInheritanceFixer',
		'typeDocEventParamFixer',
		'typeDocInterfaceAugmentationFixer'
	],
	[
		'typeDocPurgePrivateApiDocs'
	],
	[
		'validators'
	]
];

/**
 * Returns the priority of a plugin. To avoid collisions between the built-in TypeDoc plugins, the priority is negative.
 *
 * @param pluginName
 */
export function getPluginPriority( pluginName: string ): number {
	for ( let i = 0; i < pluginGroups.length; i++ ) {
		if ( pluginGroups[ i ]!.includes( pluginName ) ) {
			if ( i === 0 ) {
				return 0;
			}

			return -i;
		}
	}

	return -pluginGroups.length;
}
