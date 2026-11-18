/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
import type { Page } from "puppeteer";
import type SingleBrowserImplementationType from "puppeteer-cluster/dist/concurrency/SingleBrowserImplementation.js";
import type { ResourceData } from "puppeteer-cluster/dist/concurrency/ConcurrencyImplementation.js";
declare const SingleBrowserImplementation: typeof SingleBrowserImplementationType;
/**
* Pages whose crawler task is still running. When a task times out, `puppeteer-cluster` frees its page without waiting
* for the task to end, so such a page may still be used by the task and cannot be reused.
*/
export declare const busyPages: WeakSet<Page>;
/**
* Works like `Cluster.CONCURRENCY_PAGE` (all pages share one browser), but reuses browser tabs instead of opening
* a new tab for every page. Opening a tab is expensive, and a reused tab can also keep using the same renderer process
* when the next page comes from the same site.
*
* Between pages, a tab is reset to `about:blank`. A tab that cannot be reset, or that reached `MAX_PAGE_USES`,
* is closed and replaced with a new one.
*/
export declare class ReusedPageConcurrency extends SingleBrowserImplementation {
	private readonly idlePages;
	private readonly pageUses;
	protected createResources(): Promise<ResourceData>;
	protected freeResources({ page }: ResourceData): Promise<void>;
}
export {};
