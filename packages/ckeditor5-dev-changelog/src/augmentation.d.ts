declare module "@ckeditor/ckeditor5-dev-release-tools" {
	export async function findPathsToPackages( cwd: string, packagesDirectory: string | null, options?: {
		includePackageJson?: boolean;
		includeCwd?: boolean;
		packagesDirectoryFilter?: PackageJsonFilter | null;
	} ): Promise<Array<string>>;

	export async function provideNewVersionForMonoRepository( options: {
		packageName: string;
		version: string;
		bumpType: string;
		indentLevel?: number;
	} ): Promise<string>;

	export function truncateChangelog( length: number, cwd: string ): void;
}

type PackageJsonFilter = ( packageJsonPath: string ) => boolean
