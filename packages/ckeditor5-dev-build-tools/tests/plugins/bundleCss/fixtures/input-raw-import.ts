/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// @ts-expect-error - The `?raw` import is resolved by the `rawImport` plugin.
import direct from './direct.css?raw';
import './index-editor.css';

console.log( direct );
