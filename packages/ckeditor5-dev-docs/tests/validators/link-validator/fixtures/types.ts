/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/types
 */

export type MentionFeedObjectItem = {

	/**
	 * A unique ID of the mention. It must start with the marker character.
	 */
	id: string;

	/**
	 * Text inserted into the editor when creating a mention.
	 */
	text?: string;
};
