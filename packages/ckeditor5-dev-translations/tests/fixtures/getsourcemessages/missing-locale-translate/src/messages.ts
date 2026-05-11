/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Locale } from '@ckeditor/ckeditor5-utils';

export function collectMissingLocaleTranslateMessages( locale: Locale ): void {
	locale.t( 'Missing LocaleTranslate export translation' );
}
