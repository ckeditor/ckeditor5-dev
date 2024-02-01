import path from 'upath';

/**
 * Returns path relative to the current working directory.
 */
export function getPath( ...paths: string[] ): string {
	return path.join( process.cwd(), ...paths );
}
