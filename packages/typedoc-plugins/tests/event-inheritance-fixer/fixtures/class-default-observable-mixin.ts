/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/class-default-observable-mixin
 */

import { ObservableMixin, type ObservableMixinConstructor } from './observable-mixin.js';

const ClassDefaultObservableMixinBase: ObservableMixinConstructor = ObservableMixin();

export class ClassDefaultObservableMixin extends ClassDefaultObservableMixinBase {}
