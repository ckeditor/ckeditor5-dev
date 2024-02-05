import MagicString from 'magic-string';
import type { Plugin } from 'rollup';

export interface RollupReplaceOptions {

	/**
	 * Array containing tuples of pattern and replace value.
	 * 
	 * @example
	 * [
	 *   [ 'find', 'replace' ],
	 *   [ /find/g, 'replace' ]
	 * ]
	 */
	replace: Array<[ RegExp | string, string ]>;

	/**
	 * Whether to generate a source map.
	 * 
	 * @default false
	 */
	sourceMap?: boolean;
}

export function replace( pluginOptions: RollupReplaceOptions ): Plugin {
	const options: Required<RollupReplaceOptions> = Object.assign( {
		replace: [],
		sourceMap: false
	}, pluginOptions);

	return {
		name: 'cke5-replace',

		transform( source ) {
			const magic = new MagicString( source );

			options.replace.forEach( replace => magic.replaceAll( ...replace ) );

			return {
				code: magic.toString(),
				map: options.sourceMap ? magic.generateMap() : null
			}
		}
	}
}
