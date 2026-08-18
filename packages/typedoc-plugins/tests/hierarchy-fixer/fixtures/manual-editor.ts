/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/manual-editor
 */

import { Editor } from './editor.js';
import { ElementApiMixin, type ElementApi } from './element-api-mixin.js';

const ManualEditorBase = ElementApiMixin( Editor );

export class ManualEditor extends ManualEditorBase implements ElementApi {}
