/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Same imports as `index.ts` on purpose: Rolldown deduplicates repeated imports of a single
// module, so testing CSS deduplication requires a second module importing the same entries.
import '../theme/index-editor.css';
import '../theme/index-content.css';
