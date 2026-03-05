/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import type { CamelCase, CamelCasedProperties } from 'type-fest';
import type { InputPluginOption } from 'rollup';
/**
 * Transforms `kebab-case` strings to `camelCase`.
 */
export declare function camelize<T extends string>(s: T): CamelCase<T>;
/**
 * Transforms first-level object keys from `kebab-case` to `camelCase`.
 */
export declare function camelizeObjectKeys<T extends Record<string, any>>(obj: T): CamelCasedProperties<T>;
/**
 * Returns string without whitespace.
 */
export declare function removeWhitespace(text: string): string;
/**
 * Returns string without newline.
 */
export declare function removeNewline(text: string): string;
/**
 * Returns dependency resolved relative to the current working directory. This is needed to ensure
 * that the dependency of this package itself (which may be in a different version) is not used.
 */
export declare function getUserDependency(name: string): any;
/**
 * Returns plugin if condition is truthy. This is used only to get the types right.
 */
export declare function getOptionalPlugin<T extends InputPluginOption>(condition: unknown, plugin: T): T | undefined;
