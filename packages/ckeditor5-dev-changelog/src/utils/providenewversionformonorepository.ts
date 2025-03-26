/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import semver, { type ReleaseType } from 'semver';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { randomUUID } from 'crypto';
import upath from 'upath';
import os from 'os';
import fs from 'fs-extra';
import pacote from 'pacote';

const CLI_INDENT_SIZE = 3;

interface VersionOptions {
	packageName: string;
	version: string;
	bumpType: ReleaseType;
	indentLevel?: number;
}

type ValidationResult = {
	isValid: boolean;
	message?: string;
};

interface VersionQuestion {
	type: 'input';
	name: 'version';
	default: string;
	message: string;
	filter: (input: string) => string;
	validate: (input: string) => Promise<ValidationResult>;
	prefix: string;
}

class VersionValidator {
	/**
	 * Validates if the provided version string is a valid semver version.
	 * 
	 * @param version - Version string to validate
	 * @returns Validation result indicating if the version is valid
	 */
	static validateFormat(version: string): ValidationResult {
		if (!semver.valid(version)) {
			return { isValid: false, message: 'Please provide a valid version.' };
		}
		return { isValid: true };
	}

	/**
	 * Validates if the provided version is higher than the current version.
	 * 
	 * @param version - Version string to validate
	 * @param currentVersion - Current version to compare against
	 * @returns Validation result indicating if the version is higher
	 */
	static validateHigherThanCurrent(version: string, currentVersion: string): ValidationResult {
		if (!semver.gt(version, currentVersion)) {
			return { 
				isValid: false, 
				message: `Provided version must be higher than "${currentVersion}".` 
			};
		}
		return { isValid: true };
	}

	/**
	 * Validates if the provided version is available in the npm registry.
	 * 
	 * @param version - Version string to validate
	 * @param packageName - Name of the package to check
	 * @returns Validation result indicating if the version is available
	 */
	static async validateAvailability(version: string, packageName: string): Promise<ValidationResult> {
		try {
			const isAvailable = await PacoteService.checkVersionAvailability(version, packageName);
			if (!isAvailable) {
				return { isValid: false, message: 'Given version is already taken.' };
			}
			return { isValid: true };
		} catch (error) {
			throw new Error(
				`Failed to check version availability: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

class PacoteService {
	private static createCachelessManifest = (callback: typeof pacote.manifest) => {
		return async (description: string, options = {}) => {
			const uuid = randomUUID();
			const cacheDir = upath.join(os.tmpdir(), `pacote--${uuid}`);

			await fs.ensureDir(cacheDir);

			try {
				return await callback(description, {
					...options,
					cache: cacheDir,
					memoize: false,
					preferOnline: true
				});
			} finally {
				await fs.remove(cacheDir);
			}
		};
	};

	private static manifest = this.createCachelessManifest(pacote.manifest);

	static async checkVersionAvailability(version: string, packageName: string): Promise<boolean> {
		try {
			await this.manifest(`${packageName}@${version}`);
			return false; // Version exists
		} catch {
			return true; // Version is available
		}
	}
}

class VersionPromptBuilder {
	static createQuestion(options: VersionOptions): VersionQuestion {
		const { version, packageName, bumpType, indentLevel = 0 } = options;
		const suggestedVersion = semver.inc(version, bumpType) || version;
		const message = this.buildPromptMessage(version, packageName, suggestedVersion);

		return {
			type: 'input',
			name: 'version',
			default: suggestedVersion,
			message,
			filter: (input: string) => input.trim(),
			validate: async (input: string): Promise<ValidationResult> => {
				const validations = [
					VersionValidator.validateFormat(input),
					VersionValidator.validateHigherThanCurrent(input, version),
					await VersionValidator.validateAvailability(input, packageName)
				];

				const failedValidation = validations.find(v => !v.isValid);
				return failedValidation || { isValid: true };
			},
			prefix: ' '.repeat(indentLevel * CLI_INDENT_SIZE) + chalk.cyan('?')
		};
	}

	private static buildPromptMessage(version: string, packageName: string, suggestedVersion: string): string {
		return `Type the new version (current highest: "${version}" for "${chalk.underline(packageName)}", suggested: "${suggestedVersion}"):`;
	}
}

/**
 * Prompts the user for a new version number with validation.
 * The function suggests a version based on the bump type and validates the input
 * to ensure it's a valid semver version, higher than the current version, and available in the npm registry.
 */
export async function provideNewVersionForMonoRepository(options: VersionOptions): Promise<string> {
	const question = VersionPromptBuilder.createQuestion(options);
	const answers = await inquirer.prompt<{ version: string }>(question as any);
	return answers.version;
}

export { PacoteService as checkVersionAvailability };

