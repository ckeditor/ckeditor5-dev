/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Test importing JSON.
import settings from './settings.json' with { type: 'json' };

// Test importing SVG.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import plus from '../theme/plus.svg';

// Test importing CSS.
import './styles.css';

// Test importing and bundling external dependencies.
export { colors } from 'chalk';

export { settings, plus };
