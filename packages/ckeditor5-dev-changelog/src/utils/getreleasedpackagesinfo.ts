/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { Entry, PackageJson, ReleaseInfo, SectionsWithEntries } from '../types.js';
import { ORGANISATION_NAMESPACE } from '../constants.js';

interface ReleaseInfoOptions {
    sections: SectionsWithEntries;
    oldVersion: string;
    newVersion: string;
    packages: Array<PackageJson>;
}

interface PackageFilterOptions {
    packagesToRemove?: Array<string>;
}

class ReleaseInfoBuilder {
    private readonly versionUpgradeText: string;
    private readonly packageNames: string[];
    private readonly newVersionReleases: string[];

    constructor(private readonly options: ReleaseInfoOptions) {
        this.versionUpgradeText = `${options.oldVersion} => ${options.newVersion}`;
        this.packageNames = options.packages.map(packageName => packageName.name);
        this.newVersionReleases = this.getNewVersionReleases();
    }

    build(): Array<ReleaseInfo> {
        const majorReleases = this.getPackageNamesByEntriesScope(this.options.sections.major.entries);
        const minorReleases = this.getPackageNamesByEntriesScope(this.options.sections.minor.entries, { packagesToRemove: majorReleases });
        const newFeaturesReleases = this.getPackageNamesByEntriesScope(this.options.sections.Feature.entries, { packagesToRemove: minorReleases });

        const packagesToRemoveFromOtherReleases = [
            majorReleases,
            minorReleases,
            newFeaturesReleases,
            this.newVersionReleases
        ].flat();

        const otherReleases = this.packageNames
            .filter(packageName => !packagesToRemoveFromOtherReleases.includes(packageName))
            .sort();

        return this.createReleaseInfos(otherReleases, majorReleases, minorReleases, newFeaturesReleases);
    }

    private createReleaseInfos(
        otherReleases: string[],
        majorReleases: string[],
        minorReleases: string[],
        newFeaturesReleases: string[]
    ): Array<ReleaseInfo> {
        const releases: Array<ReleaseInfo> = [
            {
                title: 'New packages:',
                version: this.options.newVersion,
                packages: this.newVersionReleases
            },
            {
                title: 'Major releases (contain major breaking changes):',
                version: this.versionUpgradeText,
                packages: majorReleases
            },
            {
                title: 'Minor releases (contain minor breaking changes):',
                version: this.versionUpgradeText,
                packages: minorReleases
            },
            {
                title: 'Releases containing new features:',
                version: this.versionUpgradeText,
                packages: newFeaturesReleases
            },
            {
                title: 'Other releases:',
                version: this.versionUpgradeText,
                packages: otherReleases
            }
        ];

        return releases.filter(release => release.packages?.length > 0);
    }

    private getNewVersionReleases(): string[] {
        return this.options.packages
            .filter(packageJson => packageJson.version === '0.0.1')
            .map(packageJson => packageJson.name)
            .sort();
    }

    private getPackageNamesByEntriesScope(entries: Array<Entry> = [], options: PackageFilterOptions = {}): string[] {
        const packageNamesDeduplicated = [...new Set(entries.flatMap(entry => entry.data.scope))];
        const packagesFullNames = packageNamesDeduplicated.map(scope => `${ORGANISATION_NAMESPACE}/${scope}`);
        
        return options.packagesToRemove
            ? packagesFullNames.filter(packageName => !options.packagesToRemove!.includes(packageName))
            : packagesFullNames;
    }
}

/**
 * Processes release information for packages based on their sections and versions.
 * Returns an array of release information objects containing package names grouped by release type.
 */
export async function getReleasedPackagesInfo(options: ReleaseInfoOptions): Promise<Array<ReleaseInfo>> {
    const builder = new ReleaseInfoBuilder(options);
    return builder.build();
}
