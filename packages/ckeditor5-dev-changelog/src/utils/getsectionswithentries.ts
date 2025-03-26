/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, PackageJson, ParsedFile, SectionsWithEntries, TransformScope, SectionName } from '../types.js';
import { ORGANISATION_NAMESPACE, SECTIONS } from '../constants.js';
import { linkToGithubUser } from './linktogithubuser.js';

interface SectionBuilderOptions {
	parsedFiles: Array<ParsedFile>;
	packages: Array<PackageJson>;
	gitHubUrl: string;
	transformScope: TransformScope;
}

class SectionBuilder {
	private readonly packagesNames: string[];
	private readonly packagesNamesNoNamespace: string[];
	private readonly expectedTypes = ['Feature', 'Fix', 'Other'] as const;

	constructor(private readonly options: SectionBuilderOptions) {
		this.packagesNames = options.packages.map(packageJson => packageJson.name);
		this.packagesNamesNoNamespace = this.packagesNames.map(
			packageName => packageName.replace(`${ORGANISATION_NAMESPACE}/`, '')
		);
	}

	build(): SectionsWithEntries {
		return this.options.parsedFiles.reduce<SectionsWithEntries>(
			(sections, entry) => this.processEntry(sections, entry),
			structuredClone(SECTIONS) as SectionsWithEntries
		);
	}

	private processEntry(sections: SectionsWithEntries, entry: ParsedFile): SectionsWithEntries {
		const section = this.determineSection(entry);
		const changeMessage = this.buildChangeMessage(entry);
		const newEntry: Entry = {
			message: changeMessage,
			data: {
				...entry.data,
				mainContent: entry.content.split('\n\n')[0],
				restContent: entry.content.split('\n\n').slice(1)
			}
		};

		const sectionKey = section as SectionName;
		sections[sectionKey].entries = [...sections[sectionKey].entries ?? [], newEntry];
		return sections;
	}

	private determineSection(entry: ParsedFile): SectionName {
		return !this.isEntryValid(entry)
			? 'invalid'
			: (entry.data['breaking-change'] ?? entry.data.type) as SectionName;
	}

	private buildChangeMessage(entry: ParsedFile): string {
		const [mainContent, ...restContent] = linkToGithubUser(entry.content)
			.trim()
			.split('\n\n');

		const parts = [
			'*',
			this.buildScopeLinks(entry.data.scope),
			mainContent,
			this.buildIssueLinks(entry.data.see, 'See'),
			this.buildIssueLinks(entry.data.closes, 'Closes'),
			this.buildRestContent(restContent)
		].filter(Boolean);

		return parts.join(' ');
	}

	private buildScopeLinks(scope: Array<string>): string | null {
		if (!scope) {
			return null;
		}

		return scope
			.map(scope => this.options.transformScope(scope))
			.map(({ displayName, npmUrl }) => `[${displayName}](${npmUrl})`)
			.join(', ');
	}

	private buildIssueLinks(issues: Array<string>, prefix: string): string | null {
		if (!issues) {
			return null;
		}

		return `${prefix} ${issues
			.map(id => `[#${id}](${this.options.gitHubUrl}/issues/${id})`)
			.join(', ')}.`;
	}

	private buildRestContent(restContent: string[]): string | null {
		return restContent.length
			? '\n\n  ' + restContent.join('\n\n  ')
			: null;
	}

	private isEntryValid(entry: ParsedFile): boolean {
		if (!this.expectedTypes.includes(entry.data.type as typeof this.expectedTypes[number])) {
			return false;
		}

		if (!entry.data.scope?.every(scope => this.packagesNamesNoNamespace.includes(scope))) {
			return false;
		}

		return true;
	}
}

/**
 * Processes parsed files and organizes them into sections with entries.
 * Each entry is formatted with proper links to scopes and issues.
 */
export function getSectionsWithEntries(options: SectionBuilderOptions): SectionsWithEntries {
	const builder = new SectionBuilder(options);
	return builder.build();
}
