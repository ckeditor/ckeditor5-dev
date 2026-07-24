/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// `dependency-package` is imported before `aggregate-package`, which re-imports it.
import './packages/dependency-package/src/index.ts';
import './packages/aggregate-package/src/index.ts';
