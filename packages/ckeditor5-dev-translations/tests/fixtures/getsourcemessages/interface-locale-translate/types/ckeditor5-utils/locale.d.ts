/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export interface LocaleTranslate {
	( message: string ): string;
}

export declare class Locale {
	public readonly t: LocaleTranslate;
}
