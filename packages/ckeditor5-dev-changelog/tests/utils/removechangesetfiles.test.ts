import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeChangesetFiles } from '../../src/utils/removechangesetfiles.js';
import { logInfo } from '../../src/utils/loginfo';
import fs from 'fs/promises';
import { removeEmptyDirs } from '../../src/utils/removeemptydirs';
import upath from 'upath';

vi.mock('fs/promises');
vi.mock('../../src/utils/loginfo');
vi.mock('../../src/utils/removeemptydirs');

describe('removeChangesetFiles', () => {
	const mockCwd = '/repo';
	const mockChangelogDir = 'changelog';
	const mockExternalRepositories = [
		{ cwd: '/external-repo-1', packagesDirectory: 'packages' },
		{ cwd: '/external-repo-2', packagesDirectory: 'packages' },
	];
	const mockChangesetFiles = [
		'/repo/changelog/changeset-1.md',
		'/repo/changelog/changeset-2.md',
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('logs the start of the process', async () => {
		await removeChangesetFiles(mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories);

		expect(logInfo).toHaveBeenCalledWith(expect.stringMatching(/Removing the changeset files/i));
	});

	it('removes each changeset file', async () => {
		await removeChangesetFiles(mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories);

		for (const file of mockChangesetFiles) {
			expect(fs.unlink).toHaveBeenCalledWith(file);
		}
	});

	it('removes empty directories for the main repository', async () => {
		await removeChangesetFiles(mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories);

		expect(removeEmptyDirs).toHaveBeenCalledWith(upath.join(mockCwd, mockChangelogDir));
	});

	it('removes empty directories for external repositories', async () => {
		await removeChangesetFiles(mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories);

		for (const externalRepo of mockExternalRepositories) {
			expect(removeEmptyDirs).toHaveBeenCalledWith(upath.join(externalRepo.cwd, mockChangelogDir));
		}
	});

	it('throws error when invalid file path passed to unlink', async () => {
		vi.mocked(fs.unlink).mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

		await expect(removeChangesetFiles(mockChangesetFiles, mockCwd, mockChangelogDir, mockExternalRepositories))
			.rejects.toThrow();
	});
});
