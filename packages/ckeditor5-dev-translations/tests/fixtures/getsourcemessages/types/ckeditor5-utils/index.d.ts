/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export type Message = {
	string: string;
	plural?: string;
	id?: string;
};

export type LocaleTranslate = (
	message: string | Message,
	values?: number | string | ReadonlyArray<number | string>
) => string;

export declare class Locale {
	public readonly t: LocaleTranslate;
}
