import { getGitHubUrl } from '../../src/utils/getgithuburl';
import fsExtra from 'fs-extra';
import upath from 'upath';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs-extra');

describe('getGitHubUrl', () => {
	const mockedReadJson = vi.mocked(fsExtra.readJson);
	const mockCwd = '/mock/project';

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return the GitHub URL without .git suffix', async () => {
		mockedReadJson.mockResolvedValueOnce({
			repository: { url: 'https://github.com/user/repo.git' }
		});

		const result = await getGitHubUrl(mockCwd);

		expect(result).toBe('https://github.com/user/repo');
		expect(mockedReadJson).toHaveBeenCalledWith(upath.join(mockCwd, 'package.json'));
	});

	it('should return the GitHub URL as-is if there is no .git suffix', async () => {
		mockedReadJson.mockResolvedValueOnce({
			repository: { url: 'https://github.com/user/repo' }
		});

		const result = await getGitHubUrl(mockCwd);

		expect(result).toBe('https://github.com/user/repo');
		expect(mockedReadJson).toHaveBeenCalledWith(upath.join(mockCwd, 'package.json'));
	});

	it('should return an empty string and log a warning if `repository.url` is missing', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		mockedReadJson.mockResolvedValueOnce({
			repository: {}
		});

		const result = await getGitHubUrl(mockCwd);

		expect(result).toBe('');
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'Warning: Git repository not found in root `package.json`, under `repository.url`.'
		);
		expect(mockedReadJson).toHaveBeenCalledWith(upath.join(mockCwd, 'package.json'));
	});

	it('should return an empty string and log a warning if `repository` field is missing', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		mockedReadJson.mockResolvedValueOnce({});

		const result = await getGitHubUrl(mockCwd);

		expect(result).toBe('');
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			'Warning: Git repository not found in root `package.json`, under `repository.url`.'
		);
		expect(mockedReadJson).toHaveBeenCalledWith(upath.join(mockCwd, 'package.json'));
	});

	it('should throw an error if `package.json` does not exist', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		mockedReadJson.mockRejectedValueOnce(new Error('File not found'));

		await expect(getGitHubUrl(mockCwd)).rejects.toThrow('File not found');

		expect(mockedReadJson).toHaveBeenCalledWith(upath.join(mockCwd, 'package.json'));
	});
});
