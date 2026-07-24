/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Test importing JSON.
import settings from './settings.json' assert { type: 'json' };

// Test importing SVG.
// @ts-ignore
import plus from '../theme/plus.svg';

// Test importing CSS entry points.
import './index-editor.css';
import './index-content.css';

// Test importing and bundling external dependencies.
export * from 'es-toolkit';

export { settings, plus };
