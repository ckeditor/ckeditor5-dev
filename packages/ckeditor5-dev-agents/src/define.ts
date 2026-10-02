/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { FileUnit, TargetConfig, Task, TaskOptions, TaskUnit } from './types.js';

/**
 * Defines a task. It returns the task unchanged and only helps with types: they are inferred from the task itself,
 * so every hook knows its input without annotations.
 *
 * * `options` from `defaultOptions`,
 * * `shared` from what `prepare()` returns,
 * * `unit` from what `scope()` returns, or `FileUnit` (with a `path`) for a task that works on `include`,
 * * `payload` from what `payload()` returns.
 *
 * ```ts
 * export default defineTask( {
 * 	id: 'meta-description',
 * 	include: [ 'docs/**\/*.md' ],
 * 	defaultOptions: { maxLength: 160 },
 * 	…
 * } );
 * ```
 */
export function defineTask<
	TShared = undefined,
	TUnit extends TaskUnit = FileUnit,
	TPayload = unknown,
	TOptions extends TaskOptions = TaskOptions
>( task: Task<TShared, TUnit, TPayload, TOptions> ): Task<TShared, TUnit, TPayload, TOptions> {
	return task;
}

/**
 * Defines a target. It returns the target unchanged and only helps with types.
 */
export function defineTarget( target: TargetConfig ): TargetConfig {
	return target;
}
