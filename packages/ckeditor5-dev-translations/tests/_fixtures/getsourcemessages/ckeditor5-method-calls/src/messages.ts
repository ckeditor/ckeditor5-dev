/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Locale, LocaleTranslate } from '@ckeditor/ckeditor5-utils';

class EditorLike {
	public declare locale: Locale;
	public declare t: LocaleTranslate;

	constructor( locale: Locale ) {
		this.locale = locale;
		this.t = locale.t;
	}
}

export class ViewLike {
	public declare editor: EditorLike;
	public declare t: LocaleTranslate;

	constructor( locale: Locale ) {
		this.editor = new EditorLike( locale );
		this.t = locale.t;
	}

	public collect( locale: Locale, useFirstBranch: boolean ): void {
		this.editor.locale.t( 'Editor locale translation' );
		this.editor.t( 'Editor shorthand translation' );
		this.t( 'View shorthand translation' );
		locale.t( 'Locale translation' );

		const t = locale.t;
		t( { string: 'Direct t alias translation', plural: 'Direct t alias translations' } );
		this.editor.locale.t( useFirstBranch ? 'First conditional branch' : { string: 'Second conditional branch', id: 'SECOND_BRANCH' } );

		const invalid = 'Invalid';
		this.editor.locale.t( invalid );
	}
}
