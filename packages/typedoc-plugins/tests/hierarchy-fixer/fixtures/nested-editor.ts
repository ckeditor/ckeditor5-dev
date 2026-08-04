/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/nested-editor
 */

import { Editor } from './editor.js';
import { EmitterMixin } from './emitter-mixin.js';
import { ElementApiMixin } from './element-api-mixin.js';

const NestedEditorBase = ElementApiMixin( EmitterMixin( Editor ) );

export class NestedEditor extends NestedEditorBase {}
