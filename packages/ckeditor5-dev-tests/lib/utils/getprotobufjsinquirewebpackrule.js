/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * `protobufjs` uses a dynamic `require()` wrapper for optional dependencies.
 * The optional dependency probing is intentional, so webpack should not report it as a critical dependency.
 *
 * @returns {object}
 */
export default function getProtobufJsInquireWebpackRule() {
	return {
		test: /@protobufjs(?:\+|[\\/])inquire.*[\\/]index\.js$/,
		parser: {
			exprContextCritical: false
		}
	};
}
