/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

declare module 'shelljs' {
	export interface ExecOptions {
		cwd?: string;
		env?: Record<string, string>;
		silent?: boolean;
		async?: boolean;
	}

	export interface ExecOutputReturnValue {
		code: number;
		stdout: string;
		stderr: string;
	}

	export interface Config {
		silent: boolean;
		fatal?: boolean;

		[ option: string ]: any;
	}

	export function exec(
		command: string,
		options?: ExecOptions,
		callback?: ( code: number, stdout: string, stderr: string ) => void
	): ExecOutputReturnValue | void; // eslint-disable-line @typescript-eslint/no-invalid-void-type

	const sh: {
		exec: typeof exec;
		config: Config;
	};

	export default sh;
}
