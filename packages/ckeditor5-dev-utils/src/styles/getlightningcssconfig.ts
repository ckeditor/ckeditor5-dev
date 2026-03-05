/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Features } from 'lightningcss';

type GetLightningCssConfigOptions = {

	/**
	 * When true, a source map will be generated for transformed CSS.
	 */
	sourceMap?: boolean;

	/**
	 * When true, the output CSS will be minified.
	 */
	minify?: boolean;
};

type LightningCssConfig = {

	/**
	 * Whether to generate source map.
	 */
	sourceMap: boolean;

	/**
	 * Whether to generate minified output.
	 */
	minify: boolean;

	/**
	 * Features that should always be compiled.
	 */
	include: number;
};

/**
 * Returns a Lightning CSS configuration used by the stylesheet loader.
 */
export default function getLightningCssConfig( options: GetLightningCssConfigOptions = {} ): LightningCssConfig {
	const {
		sourceMap = false,
		minify = false
	} = options;

	return {
		sourceMap,
		minify,
		include: Features.Nesting
	};
}
