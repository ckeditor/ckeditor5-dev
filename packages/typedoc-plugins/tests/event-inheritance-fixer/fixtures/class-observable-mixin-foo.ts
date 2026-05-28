/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/class-observable-mixin-foo
 */

import { ClassFoo } from './class-foo.js';
import { ObservableMixin, type ObservableMixinConstructor } from './observable-mixin.js';

const ClassObservableMixinFooBase: ObservableMixinConstructor<typeof ClassFoo> = ObservableMixin( ClassFoo );

export class ClassObservableMixinFoo extends ClassObservableMixinFooBase {}
