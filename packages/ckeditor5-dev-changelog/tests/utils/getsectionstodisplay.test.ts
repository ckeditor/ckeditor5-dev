import { describe, it, expect } from 'vitest';
import { getSectionsToDisplay } from '../../src/utils/getsectionstodisplay';
import type { SectionsWithEntries, Section, Entry } from '../../src/types';

const createSection = (title: string, entries: Entry[]): Section => ({
	title,
	entries
});

const createEntry = ( message: string ): Entry => ( { message } as Entry );

describe('getSectionsToDisplay', () => {
	it('should return only valid sections with entries', () => {
		const sectionsWithEntries: SectionsWithEntries = {
			major: createSection('Major Changes', [createEntry('Breaking change')]),
			minor: createSection('Minor Changes', [createEntry('Minor change')]),
			Feature: createSection('Features', []),
			Fix: createSection('Fix', []),
			Other: createSection('Other', []),
			invalid: createSection('Invalid', [createEntry('Invalid entry')])
		};

		const result = getSectionsToDisplay(sectionsWithEntries);

		expect(result).toEqual([
			{ title: 'Major Changes', entries: [{ message: 'Breaking change' }] },
			{ title: 'Minor Changes', entries: [{ message: 'Minor change' }] }
		]);
	});

	it('should return an empty array if all sections are invalid or empty', () => {
		const sectionsWithEntries: SectionsWithEntries = {
			major: createSection('Major Changes', []),
			minor: createSection('Minor Changes', []),
			Feature: createSection('Features', []),
			Fix: createSection('Fix', []),
			Other: createSection('Other', []),
			invalid: createSection('Invalid', [createEntry('Invalid entry')])
		};

		const result = getSectionsToDisplay(sectionsWithEntries);

		expect(result).toEqual([]);
	});
});
