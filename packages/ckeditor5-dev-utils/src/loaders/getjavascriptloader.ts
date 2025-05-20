/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import getDebugLoader from './getdebugloader.js';

type JavaScriptLoaderOptions = ReturnType<typeof getDebugLoader> & {
	test: RegExp;
};

export default function getJavaScriptLoader( { debugFlags }: { debugFlags: Array<string> } ): JavaScriptLoaderOptions {
	return {
		test: /\.js$/,
		...getDebugLoader( debugFlags )
	};
}
