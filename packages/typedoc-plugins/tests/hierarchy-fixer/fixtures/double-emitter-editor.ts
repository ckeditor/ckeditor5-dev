/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/double-emitter-editor
 */

import { Editor } from './editor.js';
import { EmitterMixin } from './emitter-mixin.js';

const DoubleEmitterEditorBase = EmitterMixin( EmitterMixin( Editor ) );

export class DoubleEmitterEditor extends DoubleEmitterEditorBase {}
