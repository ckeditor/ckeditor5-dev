/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import getWriterOptions from '../../lib/utils/getwriteroptions.js';

describe( 'getWriterOptions()', () => {
	const transformSpy = vi.fn();

	it( 'returns an object with writer options', () => {
		const writerOptions = getWriterOptions( transformSpy );

		expect( writerOptions ).to.have.property( 'transform', transformSpy );
		expect( writerOptions ).to.have.property( 'groupBy' );
		expect( writerOptions ).to.have.property( 'commitGroupsSort' );
		expect( writerOptions ).to.have.property( 'commitsSort' );
		expect( writerOptions ).to.have.property( 'noteGroupsSort' );
		expect( writerOptions ).to.have.property( 'mainTemplate' );
		expect( writerOptions ).to.have.property( 'headerPartial' );
		expect( writerOptions ).to.have.property( 'footerPartial' );

		expect( writerOptions.commitsSort ).to.be.a( 'array' );
		expect( writerOptions.commitGroupsSort ).to.be.a( 'function' );
		expect( writerOptions.noteGroupsSort ).to.be.a( 'function' );
	} );

	it( 'sorts notes properly', () => {
		const writerOptions = getWriterOptions( transformSpy );

		const noteGroups = [
			{ title: 'BREAKING CHANGES', notes: [] },
			{ title: 'MINOR BREAKING CHANGES', notes: [] },
			{ title: 'MAJOR BREAKING CHANGES', notes: [] }
		];

		expect( noteGroups.sort( writerOptions.noteGroupsSort ) ).to.deep.equal( [
			{ title: 'MAJOR BREAKING CHANGES', notes: [] },
			{ title: 'MINOR BREAKING CHANGES', notes: [] },
			{ title: 'BREAKING CHANGES', notes: [] }
		] );
	} );

	it( 'sorts notes properly (titles with emojis)', () => {
		const writerOptions = getWriterOptions( transformSpy );

		const noteGroups = [
			{ title: 'BREAKING CHANGES [ℹ](url)', notes: [] },
			{ title: 'MINOR BREAKING CHANGES [ℹ](url)', notes: [] },
			{ title: 'MAJOR BREAKING CHANGES [ℹ](url)', notes: [] }
		];

		expect( noteGroups.sort( writerOptions.noteGroupsSort ) ).to.deep.equal( [
			{ title: 'MAJOR BREAKING CHANGES [ℹ](url)', notes: [] },
			{ title: 'MINOR BREAKING CHANGES [ℹ](url)', notes: [] },
			{ title: 'BREAKING CHANGES [ℹ](url)', notes: [] }
		] );
	} );

	it( 'sorts groups properly', () => {
		const writerOptions = getWriterOptions( transformSpy );

		const commitGroups = [
			{ title: 'Other changes', commits: [] },
			{ title: 'Features', commits: [] },
			{ title: 'Bug fixes', commits: [] }
		];

		expect( commitGroups.sort( writerOptions.commitGroupsSort ) ).to.deep.equal( [
			{ title: 'Features', commits: [] },
			{ title: 'Bug fixes', commits: [] },
			{ title: 'Other changes', commits: [] }
		] );
	} );

	it( 'sorts groups properly (titles with emojis)', () => {
		const writerOptions = getWriterOptions( transformSpy );

		const commitGroups = [
			{ title: 'Other changes [ℹ](url)', commits: [] },
			{ title: 'Features [ℹ](url)', commits: [] },
			{ title: 'Bug fixes [ℹ](url)', commits: [] }
		];

		expect( commitGroups.sort( writerOptions.commitGroupsSort ) ).to.deep.equal( [
			{ title: 'Features [ℹ](url)', commits: [] },
			{ title: 'Bug fixes [ℹ](url)', commits: [] },
			{ title: 'Other changes [ℹ](url)', commits: [] }
		] );
	} );
} );
