/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * The directory, relative to the target root, that holds the state of every task.
 */
export const STATE_DIRECTORY = '.ai-tasks';

/**
 * The prefix of report branches: `ai-tasks/<task>/<target>/<branch>`.
 */
export const REPORT_BRANCH_PREFIX = 'ai-tasks';

/**
 * The tools an agent may use while judging. None of them can change a file.
 */
export const READ_ONLY_TOOLS: ReadonlyArray<string> = [ 'read', 'grep', 'find', 'ls' ];
