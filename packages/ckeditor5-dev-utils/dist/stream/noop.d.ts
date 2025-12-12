/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
/// <reference types="node" />
import { type Transform } from 'stream';
export default function noop(callback?: ((chunk: unknown) => unknown | Promise<unknown>)): Transform;
