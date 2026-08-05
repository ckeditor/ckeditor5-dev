/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/editor
 */

import { EmitterMixin, type EmitterMixinConstructor } from './emitter-mixin.js';

const EditorBase: EmitterMixinConstructor = EmitterMixin();

export class Editor extends EditorBase {}
