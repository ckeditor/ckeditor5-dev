/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/classic-editor
 */

import { Editor } from './editor.js';
import { ElementApiMixin, type ElementApiMixinConstructor } from './element-api-mixin.js';

const ClassicEditorBase: ElementApiMixinConstructor<typeof Editor> = ElementApiMixin( Editor );

export class ClassicEditor extends ClassicEditorBase {}
