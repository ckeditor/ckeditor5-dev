/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { getInputParsed } from '../../src/utils/getinputparsed.js';
import fs from 'fs-extra';
import matter, { type GrayMatterFile } from 'gray-matter';
import { describe, it, expect, vi } from 'vitest';
import type { ChangesetPathsWithGithubUrl } from '../../src/types.js';

vi.mock( 'fs-extra' );
vi.mock( 'gray-matter' );

describe( 'getInputParsed()', () => {
	it( 'should parse changeset files and return array of parsed files', async () => {
		// Mock data
		const changesetPath1 = '/path/to/changeset1.md';
		const changesetPath2 = '/path/to/changeset2.md';
		const gitHubUrl = 'https://github.com/ckeditor/ckeditor5';
		const fileContent1 = 'File content 1';
		const fileContent2 = 'File content 2';

		const matterResult1: GrayMatterFile<string> = {
			content: 'Parsed content 1',
			data: { type: 'feature', scope: [ 'ui' ] },
			// Additional GrayMatterFile properties
			orig: fileContent1,
			language: 'md',
			matter: '',
			stringify: () => fileContent1
		};

		const matterResult2: GrayMatterFile<string> = {
			content: 'Parsed content 2',
			data: { type: 'fix', scope: [ 'engine' ] },
			// Additional GrayMatterFile properties
			orig: fileContent2,
			language: 'md',
			matter: '',
			stringify: () => fileContent2
		};

		// Mock implementations
		vi.mocked( fs.readFile ).mockImplementation( path => {
			if ( path === changesetPath1 ) {
				return Promise.resolve( fileContent1 );
			}

			if ( path === changesetPath2 ) {
				return Promise.resolve( fileContent2 );
			}

			return Promise.resolve( '' );
		} );

		vi.mocked( matter ).mockImplementation( content => {
			if ( content === fileContent1 ) {
				return matterResult1;
			}

			if ( content === fileContent2 ) {
				return matterResult2;
			}

			return {} as any;
		} );

		// Input data
		const changesetPathsWithGithubUrl: Array<ChangesetPathsWithGithubUrl> = [
			{
				changesetPaths: [ changesetPath1, changesetPath2 ],
				gitHubUrl,
				shouldSkipLinks: false,
				cwd: '/changeset-path',
				isRoot: false
			}
		];

		// Expected results
		const expectedResults = [
			{
				...matterResult1,
				gitHubUrl,
				changesetPath: changesetPath1,
				skipLinks: false
			},
			{
				...matterResult2,
				gitHubUrl,
				changesetPath: changesetPath2,
				skipLinks: false
			}
		];

		// Execute the function
		const result = await getInputParsed( changesetPathsWithGithubUrl );

		// Assertions
		expect( result ).toEqual( expectedResults );
		expect( fs.readFile ).toHaveBeenCalledTimes( 2 );
		expect( fs.readFile ).toHaveBeenCalledWith( changesetPath1, 'utf-8' );
		expect( fs.readFile ).toHaveBeenCalledWith( changesetPath2, 'utf-8' );
		expect( matter ).toHaveBeenCalledTimes( 2 );
		expect( matter ).toHaveBeenCalledWith( fileContent1 );
		expect( matter ).toHaveBeenCalledWith( fileContent2 );
	} );

	it( 'should handle multiple repositories with different skipLinks values', async () => {
		// Mock data
		const changesetPath1 = '/path/to/repo1/changeset.md';
		const changesetPath2 = '/path/to/repo2/changeset.md';
		const gitHubUrl1 = 'https://github.com/ckeditor/ckeditor5';
		const gitHubUrl2 = 'https://github.com/ckeditor/ckeditor5-dev';
		const fileContent1 = 'File content 1';
		const fileContent2 = 'File content 2';

		const matterResult1: GrayMatterFile<string> = {
			content: 'Parsed content 1',
			data: { type: 'feature' },
			// Additional GrayMatterFile properties
			orig: fileContent1,
			language: 'md',
			matter: '',
			stringify: () => fileContent1
		};

		const matterResult2: GrayMatterFile<string> = {
			content: 'Parsed content 2',
			data: { type: 'fix' },
			// Additional GrayMatterFile properties
			orig: fileContent2,
			language: 'md',
			matter: '',
			stringify: () => fileContent2
		};

		// Mock implementations
		vi.mocked( fs.readFile ).mockImplementation( path => {
			if ( path === changesetPath1 ) {
				return Promise.resolve( fileContent1 );
			}

			if ( path === changesetPath2 ) {
				return Promise.resolve( fileContent2 );
			}

			return Promise.resolve( '' );
		} );

		vi.mocked( matter ).mockImplementation( content => {
			if ( content === fileContent1 ) {
				return matterResult1;
			}

			if ( content === fileContent2 ) {
				return matterResult2;
			}

			return {} as any;
		} );

		// Input data
		const changesetPathsWithGithubUrl: Array<ChangesetPathsWithGithubUrl> = [
			{
				changesetPaths: [ changesetPath1 ],
				gitHubUrl: gitHubUrl1,
				shouldSkipLinks: false,
				cwd: '/changeset-path-1',
				isRoot: false
			},
			{
				changesetPaths: [ changesetPath2 ],
				gitHubUrl: gitHubUrl2,
				shouldSkipLinks: true,
				cwd: '/changeset-path-2',
				isRoot: false
			}
		];

		// Expected results
		const expectedResults = [
			{
				...matterResult1,
				gitHubUrl: gitHubUrl1,
				changesetPath: changesetPath1,
				skipLinks: false
			},
			{
				...matterResult2,
				gitHubUrl: gitHubUrl2,
				changesetPath: changesetPath2,
				skipLinks: true
			}
		];

		// Execute the function
		const result = await getInputParsed( changesetPathsWithGithubUrl );

		// Assertions
		expect( result ).toEqual( expectedResults );
		expect( fs.readFile ).toHaveBeenCalledTimes( 2 );
		expect( fs.readFile ).toHaveBeenCalledWith( changesetPath1, 'utf-8' );
		expect( fs.readFile ).toHaveBeenCalledWith( changesetPath2, 'utf-8' );
		expect( matter ).toHaveBeenCalledTimes( 2 );
		expect( matter ).toHaveBeenCalledWith( fileContent1 );
		expect( matter ).toHaveBeenCalledWith( fileContent2 );
	} );

	it( 'should handle empty changeset paths array', async () => {
		// Input data
		const changesetPathsWithGithubUrl: Array<ChangesetPathsWithGithubUrl> = [
			{
				changesetPaths: [],
				gitHubUrl: 'https://github.com/ckeditor/ckeditor5',
				shouldSkipLinks: false,
				cwd: '/changeset-path-1',
				isRoot: false
			}
		];

		// Execute the function
		const result = await getInputParsed( changesetPathsWithGithubUrl );

		// Assertions
		expect( result ).toEqual( [] );
		expect( fs.readFile ).not.toHaveBeenCalled();
		expect( matter ).not.toHaveBeenCalled();
	} );

	it( 'should handle empty input array', async () => {
		// Input data
		const changesetPathsWithGithubUrl: Array<ChangesetPathsWithGithubUrl> = [];

		// Execute the function
		const result = await getInputParsed( changesetPathsWithGithubUrl );

		// Assertions
		expect( result ).toEqual( [] );
		expect( fs.readFile ).not.toHaveBeenCalled();
		expect( matter ).not.toHaveBeenCalled();
	} );
} );
