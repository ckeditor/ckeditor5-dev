import { describe, it, expect, vi, beforeEach } from 'vitest';
import chalk from 'chalk';
import { logChangelogFiles } from '../../src/utils/logchangelogfiles';
import { logInfo } from '../../src/utils/loginfo';
import type { SectionsWithEntries } from '../../src/types';

vi.mock('../../src/utils/loginfo');

describe('logChangelogFiles', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('logs changes correctly for valid sections', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: { mainContent: 'Added new feature', restContent: [] } as any
					}
				]
			}
		} as SectionsWithEntries;

		logChangelogFiles(sections);

		expect(logInfo).toHaveBeenCalledWith(`📍 ${chalk.cyan('Listing the changes...')}\n`);
		expect(logInfo).toHaveBeenCalledWith(chalk.blue('🔸 Found Features:'), { indent: 2 });
		expect(logInfo).toHaveBeenCalledWith('* "Added new feature"', { indent: 4 });
	});

	it('logs invalid section in red', () => {
		const sections: SectionsWithEntries = {
			invalid: {
				title: 'Invalid changes',
				entries: [
					{
						message: 'Invalid entry',
						data: { mainContent: 'Invalid entry', restContent: [] } as any
					}
				]
			}
		} as SectionsWithEntries;

		logChangelogFiles(sections);

		expect(logInfo).toHaveBeenCalledWith(chalk.red('🔸 Found Invalid changes:'), { indent: 2 });
		expect(logInfo).toHaveBeenCalledWith('* "Invalid entry"', { indent: 4 });
	});

	it('logs rest content with italics', () => {
		const sections: SectionsWithEntries = {
			Fix: {
				title: 'Bug fixes',
				entries: [
					{
						message: 'Fixed issue',
						data: { mainContent: 'Fixed issue', restContent: ['Additional details'] }
					}
				]
			}
		} as SectionsWithEntries;

		logChangelogFiles(sections);

		expect(logInfo).toHaveBeenCalledWith('* "Fixed issue"', { indent: 4 });
		expect(logInfo).toHaveBeenCalledWith(chalk.italic('"Additional details"'), { indent: 6 });
	});

	it('handles empty sections gracefully', () => {
		const sections: SectionsWithEntries = {
			Feature: { title: 'Features', entries: [] } as any
		} as SectionsWithEntries;

		logChangelogFiles(sections);

		expect(logInfo).toHaveBeenCalledTimes(1);
		expect(logInfo).toHaveBeenCalledWith(`📍 ${chalk.cyan('Listing the changes...')}\n`);
	});
});
