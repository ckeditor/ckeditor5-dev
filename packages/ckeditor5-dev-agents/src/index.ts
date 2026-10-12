/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// What task and target modules need. The command line is a separate entry point (`dist/cli.js`) used by the binary.
export { defineTask, defineTarget } from './define.js';
export { findingSchema } from './utils/findingschema.js';
export type {
	FileUnit,
	Finding,
	FindingInput,
	FixInput,
	JudgeInput,
	PrepareInput,
	PriorDecision,
	ScopeInput,
	TargetConfig,
	Task,
	TaskUnit,
	UnitInput,
	VerifyInput
} from './types.js';
