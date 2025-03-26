import { getChangesetFilePaths } from '../../src/utils/getchangesetfilepaths';
import { glob } from 'glob';
import upath from 'upath';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RepositoryConfig } from '../../src/types';

vi.mock('upath');
vi.mock('glob', () => ({
	glob: vi.fn()
}));

describe('getChangesetFilePaths', () => {
	beforeEach(() => {
		vi.mocked( upath.join ).mockImplementation( (...paths) => paths.join('/') )

		vi.clearAllMocks();
	});

	it('should return file paths from both local and external repositories', async () => {
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: RepositoryConfig[] = [
			{ cwd: '/mock/repo1', packagesDirectory: 'packages' },
			{ cwd: '/mock/repo2', packagesDirectory: 'packages' }
		];

		vi.mocked(glob).mockImplementation( ( _, { cwd } ) => {
			if ( cwd === '/mock/current/changesets' ) {
				return Promise.resolve([ '/mock/current/changesets/file1.md', '/mock/current/changesets/file2.md' ])
			}

			if ( cwd === '/mock/repo1/changesets' ) {
				return Promise.resolve([ '/mock/repo1/changesets/file3.md' ]);
			}

			if ( cwd === '/mock/repo2/changesets' ) {
				return Promise.resolve([ '/mock/repo2/changesets/file4.md' ]);
			}

			return Promise.resolve([]);
		} )

		const result = await getChangesetFilePaths(cwd, changesetsDirectory, externalRepositories);

		expect(result).toEqual([
			'/mock/current/changesets/file1.md',
			'/mock/current/changesets/file2.md',
			'/mock/repo1/changesets/file3.md',
			'/mock/repo2/changesets/file4.md'
		]);

		expect(glob).toHaveBeenCalledTimes(3);
		expect(glob).toHaveBeenCalledWith('**/*.md', { cwd: '/mock/current/changesets', absolute: true });
		expect(glob).toHaveBeenCalledWith('**/*.md', { cwd: '/mock/repo1/changesets', absolute: true });
		expect(glob).toHaveBeenCalledWith('**/*.md', { cwd: '/mock/repo2/changesets', absolute: true });
	});

	it('should return only local changeset files if there are no external repositories', async () => {
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: RepositoryConfig[] = [];

		vi.mocked(glob).mockResolvedValue(['/mock/current/changesets/file1.md']);

		const result = await getChangesetFilePaths(cwd, changesetsDirectory, externalRepositories);

		expect(result).toEqual(['/mock/current/changesets/file1.md']);

		expect(glob).toHaveBeenCalledTimes(1);
		expect(glob).toHaveBeenCalledWith('**/*.md', { cwd: '/mock/current/changesets', absolute: true });
	});

	it('should return only external changeset files if there are no local files', async () => {
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: RepositoryConfig[] = [{ cwd: '/mock/repo1', packagesDirectory: 'packages' }];

		vi.mocked(glob).mockImplementation( ( _, { cwd } ) => {
			if ( cwd === '/mock/current/changesets' ) {
				return Promise.resolve([])
			}

			if ( cwd === '/mock/repo1/changesets' ) {
				return Promise.resolve([ '/mock/repo1/changesets/file3.md' ]);
			}

			return Promise.resolve([]);
		} );

		const result = await getChangesetFilePaths(cwd, changesetsDirectory, externalRepositories);

		expect(result).toEqual(['/mock/repo1/changesets/file3.md']);
		expect(glob).toHaveBeenCalledTimes(2);
		expect(glob).toHaveBeenCalledWith('**/*.md', { cwd: '/mock/current/changesets', absolute: true });
		expect(glob).toHaveBeenCalledWith('**/*.md', { cwd: '/mock/repo1/changesets', absolute: true });
	});

	it('should return an empty array when no changeset files exist in any repository', async () => {
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: RepositoryConfig[] = [{ cwd: '/mock/repo1', packagesDirectory: 'packages' }];

		vi.mocked(glob).mockImplementation( () => Promise.resolve([]));

		const result = await getChangesetFilePaths(cwd, changesetsDirectory, externalRepositories);

		expect(result).toEqual([]);
		expect(glob).toHaveBeenCalledTimes(2);
	});

	it('should handle errors gracefully by rejecting the promise', async () => {
		const cwd = '/mock/current';
		const changesetsDirectory = 'changesets';
		const externalRepositories: RepositoryConfig[] = [{ cwd: '/mock/repo1', packagesDirectory: 'packages' }];

		vi.mocked(glob).mockRejectedValueOnce(new Error('Glob failed'));

		await expect(getChangesetFilePaths(cwd, changesetsDirectory, externalRepositories)).rejects.toThrow('Glob failed');
	});
});
