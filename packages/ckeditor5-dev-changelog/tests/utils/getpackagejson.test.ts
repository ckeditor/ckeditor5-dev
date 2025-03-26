import { describe, it, expect, vi, beforeEach } from 'vitest';
import fsExtra from 'fs-extra';
import upath from 'upath';
import { getPackageJson } from '../../src/utils/getpackagejson';
import type { PackageJson } from '../../src/types';

vi.mock('fs-extra');
vi.mock('upath');

describe('getPackageJson', () => {
	beforeEach(() => {
		vi.mocked( upath.join ).mockImplementation( (...paths) => paths.join('/') )

		vi.clearAllMocks();
	});

	it('should read the package.json when cwd is a directory path', async () => {
		const cwd = '/my/package/dir';
		const fakePackageJson: PackageJson = { name: 'my-package', version: '1.0.0' };

		vi.mocked(fsExtra.readJson).mockResolvedValueOnce(fakePackageJson);

		const result = await getPackageJson(cwd);

		expect(result).toEqual(fakePackageJson);
		expect(fsExtra.readJson).toHaveBeenCalledWith('/my/package/dir/package.json');
	});

	it('should read the package.json when cwd is already a package.json path', async () => {
		const cwd = '/my/package/dir/package.json';
		const fakePackageJson: PackageJson = { name: 'my-package', version: '1.0.0' };

		vi.mocked(fsExtra.readJson).mockResolvedValueOnce(fakePackageJson);

		const result = await getPackageJson(cwd);

		expect(result).toEqual(fakePackageJson);
		expect(fsExtra.readJson).toHaveBeenCalledWith(cwd);
	});

	it('should throw an error when fsExtra.readJson fails', async () => {
		const cwd = '/my/package/dir';

		vi.mocked(fsExtra.readJson).mockRejectedValueOnce(new Error('Failed to read package.json'));

		await expect(getPackageJson(cwd)).rejects.toThrowError('Failed to read package.json');
	});

});
