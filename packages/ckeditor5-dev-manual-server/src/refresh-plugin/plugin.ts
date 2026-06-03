/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Plugin } from 'vite';
import { MANUAL_REFRESH_EVENT_NAME } from '../constants.js';

export function refreshPlugin(): Plugin {
	return {
		name: 'ckeditor5-manual-refresh',
		apply: 'serve',

		handleHotUpdate( { file, server } ) {
			if ( file.endsWith( '.css' ) ) {
				return;
			}

			server.hot.send( {
				type: 'custom',
				event: MANUAL_REFRESH_EVENT_NAME
			} );

			return [];
		}
	};
}
