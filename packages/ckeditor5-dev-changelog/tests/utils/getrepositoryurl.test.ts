import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRepositoryUrl } from '../../src/utils/getrepositoryurl';
import { getPackageJson } from '../../src/utils/getpackagejson';

vi.mock('../../src/utils/getpackagejson');

describe('getRepositoryUrl', () => {
    const mockCwd = '/test/cwd';
    const mockPackageName = 'test-package';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract repository URL from string format', async () => {
        const mockPackageJson = {
            name: mockPackageName,
            version: '1.0.0',
            repository: 'https://github.com/ckeditor/ckeditor5.git'
        };
        vi.mocked(getPackageJson).mockResolvedValue(mockPackageJson);

        const result = await getRepositoryUrl(mockCwd);

        expect(getPackageJson).toHaveBeenCalledWith(mockCwd);
        expect(result).toBe('https://github.com/ckeditor/ckeditor5');
    });

    it('should extract repository URL from object format', async () => {
        const mockPackageJson = {
            name: mockPackageName,
            version: '1.0.0',
            repository: {
                type: 'git',
                url: 'https://github.com/ckeditor/ckeditor5.git'
            }
        };
        vi.mocked(getPackageJson).mockResolvedValue(mockPackageJson);

        const result = await getRepositoryUrl(mockCwd);

        expect(getPackageJson).toHaveBeenCalledWith(mockCwd);
        expect(result).toBe('https://github.com/ckeditor/ckeditor5');
    });

    it('should remove /issues suffix from repository URL', async () => {
        const mockPackageJson = {
            name: mockPackageName,
            version: '1.0.0',
            repository: 'https://github.com/ckeditor/ckeditor5/issues'
        };
        vi.mocked(getPackageJson).mockResolvedValue(mockPackageJson);

        const result = await getRepositoryUrl(mockCwd);

        expect(result).toBe('https://github.com/ckeditor/ckeditor5');
    });

    it('should throw error when repository is missing', async () => {
        const mockPackageJson = {
            name: mockPackageName,
            version: '1.0.0'
        };
        vi.mocked(getPackageJson).mockResolvedValue(mockPackageJson);

        await expect(getRepositoryUrl(mockCwd)).rejects.toThrow(
            `The package.json for "${mockPackageName}" must contain the "repository" property.`
        );
    });

    it('should use process.cwd() when no cwd is provided', async () => {
        const mockPackageJson = {
            name: mockPackageName,
            version: '1.0.0',
            repository: 'https://github.com/ckeditor/ckeditor5.git'
        };
        vi.mocked(getPackageJson).mockResolvedValue(mockPackageJson);

        await getRepositoryUrl();

        expect(getPackageJson).toHaveBeenCalledWith(process.cwd());
    });
}); 