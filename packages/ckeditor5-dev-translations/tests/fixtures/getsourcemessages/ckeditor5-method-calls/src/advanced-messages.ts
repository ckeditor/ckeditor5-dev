/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Locale, LocaleTranslate } from '@ckeditor/ckeditor5-utils';

type IndexedTranslate = Locale[ 't' ];
type LocalFunction = ( message: string ) => string;

export function collectAdvancedMessages( locale: Locale ): void {
	const t = locale.t;
	const dynamicPropertyName = 'string';
	const invalidString = 'Invalid advanced string';
	const localFunction: LocalFunction = message => message;
	const indexedObject: { t: IndexedTranslate } = { t: locale.t };
	const localObject: { t: LocalFunction } = { t: localFunction };
	const unionObject: { t: LocaleTranslate | LocalFunction } = { t: locale.t };
	const intersectionObject: { t: LocaleTranslate & { extra: true } } = {
		t: Object.assign( locale.t, { extra: true as const } )
	};

	// eslint-disable-next-line dot-notation
	locale[ 't' ]( 'Element access translation' );
	( t )( 'Parenthesized direct translation' );
	( t as LocaleTranslate )( 'As expression direct translation' );
	( t! )( 'Non-null direct translation' );
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	( <LocaleTranslate> t )( 'Type assertion direct translation' );
	( ( t ) satisfies LocaleTranslate )( 'Satisfies direct translation' );
	indexedObject.t( 'Indexed access type translation' );
	unionObject.t( 'Union type translation' );
	intersectionObject.t( 'Intersection type translation' );

	localObject.t( 'Ignored local function translation' );

	t( {
		'string': 'Quoted string property translation',
		'id': 'QUOTED_STRING_ID',
		'plural': 'Quoted string property translations'
	} );

	t( { id: 'MISSING_STRING_PROPERTY' } as unknown as { string: string; id: string } );
	t( { string: invalidString } );
	t( { [ dynamicPropertyName ]: 'Computed property translation' } as unknown as { string: string } );
	t( { ...{ string: 'Spread translation' } } );
}
