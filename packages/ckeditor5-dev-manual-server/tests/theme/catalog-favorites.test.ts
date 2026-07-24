/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test, vi } from 'vitest';
import {
	filterFavoriteEntries,
	getFavoriteActionLabel,
	getFavoriteId,
	loadFavoriteIds,
	saveFavoriteIds,
	toggleFavoriteId,
	updateFavoriteButtonState
} from '../../theme/catalog-favorites.js';

const FAVORITES_STORAGE_KEY = 'ckeditor5-manual-test-favorites';

describe( 'getFavoriteId()', () => {
	test( 'combines the package name and nested slug', () => {
		expect( getFavoriteId( {
			packageName: 'ckeditor5-foo',
			slug: 'nested/advanced'
		} ) ).to.equal( 'ckeditor5-foo/nested/advanced' );
	} );
} );

describe( 'getFavoriteActionLabel()', () => {
	test( 'returns the add action label for a test that is not a favorite', () => {
		expect( getFavoriteActionLabel( false ) ).to.equal( 'Add to favorites' );
	} );

	test( 'returns the remove action label for a favorite test', () => {
		expect( getFavoriteActionLabel( true ) ).to.equal( 'Remove from favorites' );
	} );
} );

describe( 'updateFavoriteButtonState()', () => {
	test.each( [
		{ favoriteIds: new Set<string>(), label: 'Add to favorites', isFavorite: false },
		{ favoriteIds: new Set( [ 'ckeditor5-foo/basic' ] ), label: 'Remove from favorites', isFavorite: true }
	] )( 'updates the button from the favorite identifier set', ( { favoriteIds, label, isFavorite } ) => {
		const setAttribute = vi.fn();
		const toggle = vi.fn();
		const button = {
			title: '',
			setAttribute,
			classList: { toggle }
		} as unknown as HTMLButtonElement;

		updateFavoriteButtonState( button, favoriteIds, 'ckeditor5-foo/basic' );

		expect( button.title ).to.equal( label );
		expect( setAttribute ).toHaveBeenCalledWith( 'aria-label', label );
		expect( setAttribute ).toHaveBeenCalledWith( 'aria-pressed', String( isFavorite ) );
		expect( toggle ).toHaveBeenCalledWith( 'favorite--active', isFavorite );
	} );
} );

describe( 'filterFavoriteEntries()', () => {
	test( 'returns matching entry objects in their original order and ignores stale identifiers', () => {
		const entries = [
			{ packageName: 'ckeditor5-foo', slug: 'basic', href: '/foo/basic' },
			{ packageName: 'ckeditor5-bar', slug: 'basic', href: '/bar/basic' },
			{ packageName: 'ckeditor5-foo', slug: 'nested/advanced', href: '/foo/advanced' }
		];
		const favoriteIds = new Set( [
			'ckeditor5-foo/basic',
			'ckeditor5-foo/nested/advanced',
			'ckeditor5-missing/basic'
		] );
		const result = filterFavoriteEntries( entries, favoriteIds );

		expect( result ).to.deep.equal( [ entries[ 0 ], entries[ 2 ] ] );
		expect( result[ 0 ] ).to.equal( entries[ 0 ] );
		expect( result[ 1 ] ).to.equal( entries[ 2 ] );
	} );
} );

describe( 'toggleFavoriteId()', () => {
	test( 'adds an identifier that is not a favorite', () => {
		const favoriteIds = new Set( [ 'ckeditor5-foo/basic' ] );

		toggleFavoriteId( favoriteIds, 'ckeditor5-bar/basic' );

		expect( [ ...favoriteIds ] ).to.deep.equal( [ 'ckeditor5-foo/basic', 'ckeditor5-bar/basic' ] );
	} );

	test( 'removes an identifier that is already a favorite', () => {
		const favoriteIds = new Set( [ 'ckeditor5-foo/basic', 'ckeditor5-bar/basic' ] );

		toggleFavoriteId( favoriteIds, 'ckeditor5-foo/basic' );

		expect( [ ...favoriteIds ] ).to.deep.equal( [ 'ckeditor5-bar/basic' ] );
	} );
} );

describe( 'loadFavoriteIds()', () => {
	test( 'loads favorite identifiers from local storage', () => {
		const getItem = vi.fn().mockReturnValue( '["foo/bar","baz/qux","foo/bar"]' );

		vi.stubGlobal( 'localStorage', { getItem } );

		expect( [ ...loadFavoriteIds() ] ).to.deep.equal( [ 'foo/bar', 'baz/qux' ] );
		expect( getItem ).toHaveBeenCalledWith( FAVORITES_STORAGE_KEY );
	} );

	test( 'returns an empty set when no favorites are stored', () => {
		vi.stubGlobal( 'localStorage', { getItem: vi.fn().mockReturnValue( null ) } );

		expect( [ ...loadFavoriteIds() ] ).to.deep.equal( [] );
	} );

	test.each( [
		'{broken',
		'{}',
		'["foo/bar",42]'
	] )( 'returns an empty set for invalid stored data: %s', storedValue => {
		vi.stubGlobal( 'localStorage', { getItem: vi.fn().mockReturnValue( storedValue ) } );

		expect( [ ...loadFavoriteIds() ] ).to.deep.equal( [] );
	} );

	test( 'returns an empty set when local storage is unavailable', () => {
		vi.stubGlobal( 'localStorage', {
			getItem: vi.fn( () => {
				throw new Error( 'Storage is unavailable.' );
			} )
		} );

		expect( [ ...loadFavoriteIds() ] ).to.deep.equal( [] );
	} );
} );

describe( 'saveFavoriteIds()', () => {
	test( 'persists favorite identifiers in local storage', () => {
		const setItem = vi.fn();

		vi.stubGlobal( 'localStorage', { setItem } );
		saveFavoriteIds( new Set( [ 'foo/bar', 'baz/qux' ] ) );

		expect( setItem ).toHaveBeenCalledWith( FAVORITES_STORAGE_KEY, '["foo/bar","baz/qux"]' );
	} );

	test( 'ignores local storage write failures', () => {
		vi.stubGlobal( 'localStorage', {
			setItem: vi.fn( () => {
				throw new Error( 'Storage is unavailable.' );
			} )
		} );

		expect( () => saveFavoriteIds( new Set( [ 'foo/bar' ] ) ) ).not.toThrow();
	} );
} );
