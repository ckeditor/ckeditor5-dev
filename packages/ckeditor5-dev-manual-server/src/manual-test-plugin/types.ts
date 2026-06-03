/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export interface ManualData {
	displayName: string;
	instructionsHtml: string;
	packageName: string;
}

export interface ManualPageEntry {
	displayName: string;
	htmlFilePath: string;
	instructionsFilePath?: string;
	packageName: string;
	scriptFilePath: string;
	slug: string;
}

export type ManualTestAssetExtension = 'html' | 'js' | 'md' | 'ts';
