/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

interface MinimalLoaderContext {
	query: {
		debugFlags: Array<string>;
	};

	callback( err: Error | null, content?: string | Buffer, sourceMap?: unknown ): void;
}

/**
 * The loader matches sentences like: `// @if CK_DEBUG // someDebugCode();` and uncomment them.
 * It also uncomments code after specific flags if they are provided to the webpack configuration.
 * E.g. if the `CK_DEBUG_ENGINE` flag is set to true, then all lines starting with
 * `// @if CK_DEBUG_ENGINE //` will be uncommented.
 *
 * @param {string} source
 * @param {any} map
 */
export default function ckDebugLoader(
	this: MinimalLoaderContext,
	source: string,
	map: unknown
): void {
	source = source.replace( /\/\/ @if (!?[\w]+) \/\/(.+)/g, ( match, flagName, body ) => {
		// `this.query` comes from the webpack loader configuration specified as the loader options.
		// {
		//   loader: 'path-to-the-file',
		//   options: { // <-- `this.query`
		//     debugFlags: true
		//   }
		// }

		// Do not uncomment the code if the flag is missing / falsy.
		if ( !this.query.debugFlags.includes( flagName ) ) {
			return match;
		}

		// Uncomment the code with a same length string to not break the source maps.
		return `/* @if ${ flagName } */ ${ body }`;
	} );

	this.callback( null, source, map );
}
