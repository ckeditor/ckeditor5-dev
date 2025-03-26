import { getChangesetsParsed } from '../../src/utils/getchangesetsparsed';
import fs from 'fs/promises';
import matter from 'gray-matter';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises');
vi.mock('gray-matter')

describe('getChangesetsParsed', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should parse markdown files correctly', async () => {
		const filePaths = ['/mock/file1.md', '/mock/file2.md'];

		const fileContents = [
			'---\ntitle: "First Change"\n---\nSome changes',
			'---\ntitle: "Second Change"\n---\nMore changes'
		];

		const parsedResults = [
			{ content: 'Some changes', data: { title: 'First Change' } },
			{ content: 'More changes', data: { title: 'Second Change' } }
		];

		vi.mocked(fs.readFile).mockImplementation((file) => {
			return Promise.resolve(file === filePaths[0] ? fileContents[0] : fileContents[1]);
		});

		vi.mocked(matter).mockImplementation((content: any) => {
			return parsedResults[fileContents.indexOf(content)] as any;
		});

		const result = await getChangesetsParsed(filePaths);

		expect(result).toEqual(parsedResults);
		expect(fs.readFile).toHaveBeenCalledTimes(2);
		expect(matter).toHaveBeenCalledTimes(2);
	});

	it('should return an empty array if no files are provided', async () => {
		const result = await getChangesetsParsed([]);

		expect(result).toEqual([]);
		expect(fs.readFile).not.toHaveBeenCalled();
		expect(matter).not.toHaveBeenCalled();
	});

	it('should handle empty files gracefully', async () => {
		const filePaths = ['/mock/empty.md'];

		vi.mocked(fs.readFile).mockResolvedValueOnce('');
		vi.mocked(matter).mockReturnValue({ content: '', data: {} } as any);

		const result = await getChangesetsParsed(filePaths);

		expect(result).toEqual([{ content: '', data: {} }]);
		expect(fs.readFile).toHaveBeenCalledWith('/mock/empty.md', 'utf-8');
		expect(matter).toHaveBeenCalledTimes(1);
	});

	it('should throw an error if reading a file fails', async () => {
		const filePaths = ['/mock/file1.md'];

		vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File read error'));

		await expect(getChangesetsParsed(filePaths)).rejects.toThrow('File read error');

		expect(fs.readFile).toHaveBeenCalledWith('/mock/file1.md', 'utf-8');
		expect(matter).not.toHaveBeenCalled();
	});

	it('should throw an error if gray-matter fails to parse', async () => {
		const filePaths = ['/mock/file1.md'];

		vi.mocked(fs.readFile).mockResolvedValueOnce('---\ninvalid: file\n::');
		vi.mocked(matter).mockImplementation(() => {
			throw new Error('Parsing error');
		});

		await expect(getChangesetsParsed(filePaths)).rejects.toThrow('Parsing error');

		expect(fs.readFile).toHaveBeenCalledWith('/mock/file1.md', 'utf-8');
		expect(matter).toHaveBeenCalledTimes(1);
	});
});
