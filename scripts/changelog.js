#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

require( '../packages/ckeditor5-dev-env' )
	.generateChangelogForMonoRepository( {
		cwd: process.cwd(),
		packages: 'packages',
		transformScope: name => {
			if ( name === 'jsdoc-plugins' ) {
				return 'https://www.npmjs.com/package/@ckeditor/jsdoc-plugins';
			}

			if ( name === 'typedoc-plugins' ) {
				return 'https://www.npmjs.com/package/@ckeditor/typedoc-plugins';
			}

			return 'https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-' + name;
		}
	} );
