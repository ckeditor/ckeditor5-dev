#!/usr/bin/env node
import { createRequire } from "node:module";
import { stripVTControlCharacters, styleText } from "node:util";
import { cpus } from "node:os";
import { Cluster } from "puppeteer-cluster";
//#region src/constants.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Errors from the following hosts will be ignored.
*/
const IGNORED_HOSTS = [
	"visualwebsiteoptimizer.com",
	"fury.io",
	"shields.io",
	"coveralls.io",
	"spotify.com",
	"vimeo.com",
	"youtube.com",
	"twitter.com",
	"twimg.com",
	"facebook.com",
	"facebook.net",
	"challenges.cloudflare.com",
	"binance.com",
	"iframe.ly",
	"jsfiddle.net",
	"fonts.googleapis.com",
	"kapa.ai",
	"if-cdn.com"
];
const DEFAULT_CONCURRENCY = Math.min(cpus().length, 16);
const DEFAULT_TIMEOUT = 2e4;
const DEFAULT_RETRY_DELAY = 1e3;
const ERROR_TYPES = {
	PAGE_CRASH: {
		event: "error",
		description: "Page crash"
	},
	UNCAUGHT_EXCEPTION: {
		event: "pageerror",
		description: "Uncaught exception"
	},
	REQUEST_FAILURE: {
		event: "requestfailed",
		description: "Request failure"
	},
	RESPONSE_FAILURE: {
		event: "response",
		description: "Response failure"
	},
	CONSOLE_ERROR: {
		event: "console",
		description: "Console error"
	},
	NAVIGATION_ERROR: { description: "Navigation error" }
};
const PATTERN_TYPE_TO_ERROR_TYPE_MAP = {
	"page-crash": ERROR_TYPES.PAGE_CRASH,
	"uncaught-exception": ERROR_TYPES.UNCAUGHT_EXCEPTION,
	"request-failure": ERROR_TYPES.REQUEST_FAILURE,
	"response-failure": ERROR_TYPES.RESPONSE_FAILURE,
	"console-error": ERROR_TYPES.CONSOLE_ERROR,
	"navigation-error": ERROR_TYPES.NAVIGATION_ERROR
};
const META_TAG_NAME = "x-cke-crawler-ignore-patterns";
const DATA_ATTRIBUTE_NAME = "data-cke-crawler-skip";
//#endregion
//#region src/errors/reporter.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Analyzes collected errors and logs them in the console.
*/
function logErrors(errors) {
	if (!errors.size) {
		console.log(styleText(["green", "bold"], "\n✨ No errors have been found.\n"));
		return;
	}
	console.log(styleText(["red", "bold"], "\n🔥 The following errors have been found:"));
	errors.forEach((errorCollection, errorType) => {
		const numberOfErrors = errorCollection.size;
		const separator = styleText("gray", " ➜ ");
		const errorName = styleText([
			"bgRed",
			"white",
			"bold"
		], ` ${errorType.description.toUpperCase()} `);
		const errorSummary = styleText("red", `${styleText("bold", numberOfErrors.toString())} ${numberOfErrors > 1 ? "errors" : "error"}`);
		console.group(`\n${errorName} ${separator} ${errorSummary}`);
		errorCollection.forEach((error, message) => {
			console.group(`\n❌ ${message}`);
			if (error.details) console.log(error.details);
			console.log(styleText("red", `\n…found on the following ${error.pages.size > 1 ? "pages" : "page"}:`));
			error.pages.forEach((pageUrl) => console.log(styleText("gray", `➥  ${pageUrl}`)));
			console.groupEnd();
		});
		console.groupEnd();
	});
	console.log();
}
//#endregion
//#region src/errors/error-store.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Returns an empty collection for crawler errors.
*/
function createErrorStore() {
	return /* @__PURE__ */ new Map();
}
/**
* Returns an error collector, which is called every time new error is found.
*/
function createErrorCollector(errors) {
	return (error) => {
		if (!errors.has(error.type)) errors.set(error.type, /* @__PURE__ */ new Map());
		const messageLines = error.message.split("\n");
		const firstMessageLine = messageLines.shift();
		const nextMessageLines = messageLines.join("\n");
		const errorCollection = errors.get(error.type);
		if (!errorCollection.has(firstMessageLine)) errorCollection.set(firstMessageLine, {
			pages: /* @__PURE__ */ new Set(),
			details: nextMessageLines
		});
		errorCollection.get(firstMessageLine).pages.add(error.pageUrl);
	};
}
//#endregion
//#region src/utils.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Transforms any value to an array. If the provided value is already an array, it is returned unchanged.
*/
function toArray(data) {
	return Array.isArray(data) ? data : [data];
}
/**
* Extracts base URL from the provided page URL. Base URL consists of a protocol, a host, a port, and a path.
* A hash and search parts are omitted, because they would have navigated to the same page if they were set.
*/
function getBaseUrl(url) {
	const { origin, pathname } = new URL(url);
	return `${origin}${pathname}`;
}
/**
* Checks, if provided string is a valid URL utilizing the HTTP or HTTPS protocols.
*/
function isUrlValid(url) {
	try {
		return ["http:", "https:"].includes(new URL(url).protocol);
	} catch {
		return false;
	}
}
/**
* Checks if URLs are equal after normalization.
*/
function areSameUrl(firstUrl, secondUrl) {
	try {
		return new URL(firstUrl).href === new URL(secondUrl).href;
	} catch {
		return firstUrl === secondUrl;
	}
}
//#endregion
//#region src/crawler/reused-page-concurrency.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
const SingleBrowserImplementation = createRequire(import.meta.url)("puppeteer-cluster/dist/concurrency/SingleBrowserImplementation.js").default;
/**
* How many pages a single tab opens before it is closed and replaced with a new one. Limits the impact of anything
* a page leaves behind in the tab, like memory leaks.
*/
const MAX_PAGE_USES = 50;
/**
* How long resetting a tab between pages may take before the tab is closed instead. It must stay well below
* the 5 seconds that `puppeteer-cluster` gives `freeResources()` before it restarts the whole browser.
*/
const PAGE_RESET_TIMEOUT = 2e3;
/**
* Pages whose crawler task is still running. When a task times out, `puppeteer-cluster` frees its page without waiting
* for the task to end, so such a page may still be used by the task and cannot be reused.
*/
const busyPages = /* @__PURE__ */ new WeakSet();
/**
* Works like `Cluster.CONCURRENCY_PAGE` (all pages share one browser), but reuses browser tabs instead of opening
* a new tab for every page. Opening a tab is expensive, and a reused tab can also keep using the same renderer process
* when the next page comes from the same site.
*
* Between pages, a tab is reset to `about:blank`. A tab that cannot be reset, or that reached `MAX_PAGE_USES`,
* is closed and replaced with a new one.
*/
var ReusedPageConcurrency = class extends SingleBrowserImplementation {
	idlePages = [];
	pageUses = /* @__PURE__ */ new WeakMap();
	async createResources() {
		while (this.idlePages.length) {
			const page = this.idlePages.pop();
			if (!page.isClosed() && page.browser() === this.browser) return { page };
		}
		return { page: await this.browser.newPage() };
	}
	async freeResources({ page }) {
		const uses = (this.pageUses.get(page) || 0) + 1;
		this.pageUses.set(page, uses);
		if (uses < MAX_PAGE_USES && !busyPages.has(page) && await resetPage(page)) {
			this.idlePages.push(page);
			return;
		}
		page.close().catch(() => {});
	}
};
/**
* Prepares a tab for the next page and returns `false` if that failed.
*/
async function resetPage(page) {
	if (page.isClosed()) return false;
	page.removeAllListeners("error");
	const onDialog = (dialog) => {
		(dialog.type() === "beforeunload" ? dialog.accept() : dialog.dismiss()).catch(() => {});
	};
	page.on("dialog", onDialog);
	const reset = (async () => {
		await page.setRequestInterception(false);
		await page.goto("about:blank");
	})();
	let timeoutId;
	const timeout = new Promise((resolve, reject) => {
		timeoutId = setTimeout(() => reject(/* @__PURE__ */ new Error("Resetting the page timed out.")), PAGE_RESET_TIMEOUT);
	});
	try {
		await Promise.race([reset, timeout]);
		return true;
	} catch {
		reset.catch(() => {});
		return false;
	} finally {
		clearTimeout(timeoutId);
		page.off("dialog", onDialog);
	}
}
//#endregion
//#region src/crawler/create-cluster.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Creates crawler cluster with all retries and global error handling configured.
*/
async function createCrawlerCluster({ timeout, concurrency, reuseTabs, disableBrowserSandbox, ignoreHTTPSErrors, silent, onError }) {
	const cluster = await Cluster.launch({
		concurrency: reuseTabs ? ReusedPageConcurrency : Cluster.CONCURRENCY_PAGE,
		timeout,
		retryLimit: 3,
		retryDelay: DEFAULT_RETRY_DELAY,
		maxConcurrency: concurrency,
		puppeteerOptions: createPuppeteerOptions({
			disableBrowserSandbox,
			ignoreHTTPSErrors
		}),
		skipDuplicateUrls: false,
		monitor: !silent
	});
	cluster.on("taskerror", (err, data, willRetry = false) => {
		if (willRetry) {
			if (!silent) console.log(`Retrying ${getUrlPathname(data.url)}...`);
			return;
		}
		if (err?.crawlerErrors) {
			err.crawlerErrors.forEach((error) => onError(error));
			return;
		}
		onError({
			pageUrl: data.url,
			type: ERROR_TYPES.PAGE_CRASH,
			message: err?.message ? `Error crawling ${getUrlPathname(data.url)}: ${err.message}` : "(empty message)"
		});
	});
	return cluster;
}
function createPuppeteerOptions({ disableBrowserSandbox, ignoreHTTPSErrors }) {
	const puppeteerOptions = {
		args: [
			"--disable-extensions",
			"--disable-plugins",
			"--disable-software-rasterizer",
			"--disable-renderer-backgrounding",
			"--disable-background-timer-throttling",
			"--disable-backgrounding-occluded-windows",
			"--disable-sync",
			"--disable-translate",
			"--disable-infobars",
			"--no-first-run",
			"--no-default-browser-check"
		],
		headless: true,
		acceptInsecureCerts: ignoreHTTPSErrors
	};
	if (disableBrowserSandbox) {
		puppeteerOptions.args.push("--no-sandbox");
		puppeteerOptions.args.push("--disable-setuid-sandbox");
	}
	return puppeteerOptions;
}
function getUrlPathname(url) {
	try {
		return new URL(url).pathname;
	} catch {
		return url;
	}
}
//#endregion
//#region src/errors/ignore-patterns.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Finds all meta tags, that contain a pattern to ignore errors, and then returns a map between error type and these patterns.
*/
async function getErrorIgnorePatternsFromPage(page) {
	const patterns = /* @__PURE__ */ new Map();
	const metaTag = await page.$(`head > meta[name="${META_TAG_NAME}"]`);
	if (!metaTag) return patterns;
	const contentString = await metaTag.evaluate((metaTag) => metaTag.getAttribute("content"));
	if (!contentString) return patterns;
	let content;
	try {
		content = JSON.parse(contentString);
	} catch {
		return patterns;
	}
	Object.entries(content).forEach(([type, pattern]) => {
		const patternCollection = new Set(toArray(pattern).filter((pattern) => typeof pattern === "string").filter((pattern) => pattern.length > 0));
		if (!patternCollection.size) return;
		const errorType = PATTERN_TYPE_TO_ERROR_TYPE_MAP[type];
		if (!errorType) return;
		patterns.set(errorType, patternCollection);
	});
	return patterns;
}
/**
* Iterates over all found errors from given link and marks errors as ignored, if their message match the ignore pattern.
*/
function markErrorsAsIgnored(errors, errorIgnorePatterns) {
	errors.forEach((error) => {
		if (!errorIgnorePatterns.has(error.type)) return;
		if (Array.from(errorIgnorePatterns.get(error.type)).some((pattern) => {
			const message = stripVTControlCharacters(error.message);
			return pattern === "*" || message.includes(pattern) || error.failedResourceUrl?.includes(pattern);
		})) error.ignored = true;
	});
}
//#endregion
//#region src/page/request-policy.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
const REQUEST_ABORT_REASON = "blockedbyclient";
/**
* Returns true when request should be blocked by the crawler.
*/
function shouldAbortRequest(request) {
	const { hostname, pathname } = new URL(request.url());
	if (!hostname) return false;
	if (request.resourceType() === "media") return true;
	if (IGNORED_HOSTS.some((host) => hostname.endsWith(host))) return true;
	if (pathname.endsWith("api.json")) return true;
	return false;
}
//#endregion
//#region src/page/page-events.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Attaches Puppeteer listeners used by the crawler and returns a cleanup function.
*/
function attachPageEventHandlers({ page, data, pageErrors }) {
	const onRequest = async (request) => {
		try {
			if (shouldAbortRequest(request)) {
				await request.abort(REQUEST_ABORT_REASON);
				return;
			}
			await request.continue();
		} catch {}
	};
	const onDialog = async (dialog) => {
		await dialog.dismiss();
	};
	const onPageCrash = (error) => {
		pageErrors.push({
			pageUrl: data.url,
			type: ERROR_TYPES.PAGE_CRASH,
			message: getErrorMessage(error)
		});
	};
	const onUncaughtException = (error) => {
		pageErrors.push({
			pageUrl: data.url,
			type: ERROR_TYPES.UNCAUGHT_EXCEPTION,
			message: getErrorMessage(error)
		});
	};
	const onRequestFailure = (request) => {
		const error = getRequestFailureError(request, data);
		if (error) pageErrors.push(error);
	};
	const onResponseFailure = (response) => {
		const error = getResponseFailureError(response, data);
		if (error) pageErrors.push(error);
	};
	const onConsoleError = async (message) => {
		const error = await getConsoleError(message, data);
		if (error) pageErrors.push(error);
	};
	page.on("request", onRequest);
	page.on("dialog", onDialog);
	page.on(ERROR_TYPES.PAGE_CRASH.event, onPageCrash);
	page.on(ERROR_TYPES.UNCAUGHT_EXCEPTION.event, onUncaughtException);
	page.on(ERROR_TYPES.REQUEST_FAILURE.event, onRequestFailure);
	page.on(ERROR_TYPES.RESPONSE_FAILURE.event, onResponseFailure);
	page.on(ERROR_TYPES.CONSOLE_ERROR.event, onConsoleError);
	return () => {
		page.off("request", onRequest);
		page.off("dialog", onDialog);
		page.off(ERROR_TYPES.PAGE_CRASH.event, onPageCrash);
		page.off(ERROR_TYPES.UNCAUGHT_EXCEPTION.event, onUncaughtException);
		page.off(ERROR_TYPES.REQUEST_FAILURE.event, onRequestFailure);
		page.off(ERROR_TYPES.RESPONSE_FAILURE.event, onResponseFailure);
		page.off(ERROR_TYPES.CONSOLE_ERROR.event, onConsoleError);
	};
}
function getErrorMessage(error) {
	if (Error.isError(error)) return error.message || "(empty message)";
	return "(empty message)";
}
function getRequestFailureError(request, data) {
	const errorText = request.failure()?.errorText;
	if (request.response()?.ok() && request.method() === "POST") return null;
	if (errorText?.includes("net::ERR_BLOCKED_BY_CLIENT")) return null;
	const url = request.url();
	const host = new URL(url).host;
	const isNavigation = isTopLevelNavigationRequest(request);
	const message = isNavigation ? `Failed to open link ${styleText("bold", url)}` : `Failed to load resource from ${styleText("bold", host)}`;
	return {
		pageUrl: isNavigation ? data.parentUrl : data.url,
		type: ERROR_TYPES.REQUEST_FAILURE,
		message: `${message} (failure message: ${styleText("bold", errorText || "(empty message)")})`,
		failedResourceUrl: url
	};
}
function getResponseFailureError(response, data) {
	const responseStatus = response.status();
	if (responseStatus <= 399) return null;
	const url = response.url();
	const host = new URL(url).host;
	const isNavigation = isTopLevelNavigationRequest(response.request());
	const message = isNavigation ? `Failed to open link ${styleText("bold", url)}` : `Failed to load resource from ${styleText("bold", host)}`;
	return {
		pageUrl: isNavigation ? data.parentUrl : data.url,
		type: ERROR_TYPES.RESPONSE_FAILURE,
		message: `${message} (HTTP response status code: ${styleText("bold", responseStatus.toString())})`,
		failedResourceUrl: url
	};
}
async function getConsoleError(message, data) {
	if (message.type() !== "error") return null;
	const text = (await Promise.all(message.args().map((arg) => {
		const remoteObject = arg.remoteObject();
		if (remoteObject.type === "string") return remoteObject.value;
		if (remoteObject.type === "object" && remoteObject.subtype === "error") return remoteObject.description;
		return arg.jsonValue();
	}))).join(" ").trim();
	if (!text) return null;
	if (text.startsWith("Failed to load resource:")) return null;
	return {
		pageUrl: data.url,
		type: ERROR_TYPES.CONSOLE_ERROR,
		message: text.split("\n")[0] || "(empty message)"
	};
}
/**
* Checks, if HTTP request was a navigation one, i.e. request that is driving frame's navigation. Requests sent from child frames
* (i.e. from <iframe>) are not treated as a navigation. Only a request from a top-level frame is navigation.
*/
function isTopLevelNavigationRequest(request) {
	const frame = request.frame();
	return request.isNavigationRequest() && frame !== null && frame.parentFrame() === null;
}
//#endregion
//#region src/page/get-all-links.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Returns all links on the page.
*
* This function is in a separate file to allow using DOM APIs thanks to TypeScript
* and eslint magic comments above.
*/
function getAllLinks(ignoreAttribute) {
	return Array.from(document.links).filter((link) => link.href && !link.hasAttribute(ignoreAttribute) && !link.hasAttribute("download") && /^https?:$/.test(link.protocol)).map((link) => link.origin + link.pathname).filter((link, index, array) => array.indexOf(link) === index);
}
//#endregion
//#region src/crawler/get-links-from-page.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Finds all links in opened page and filters out external, already discovered and explicitly excluded ones.
*/
async function getLinksFromPage({ page, baseUrl, discoveredLinks, exclusions }) {
	return (await page.evaluate(getAllLinks, DATA_ATTRIBUTE_NAME)).filter((link) => {
		return link.startsWith(baseUrl) && !discoveredLinks.has(link) && !exclusions.some((exclusion) => link.includes(exclusion));
	});
}
//#endregion
//#region src/crawler/process-page.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Crawls a single page, reports all discovered errors and queues new links.
*/
async function processPage({ page, data, cluster, baseUrl, discoveredLinks, exclusions }) {
	await page.setRequestInterception(true);
	const pageErrors = [];
	const detachPageEventHandlers = attachPageEventHandlers({
		page,
		data,
		pageErrors
	});
	try {
		const pendingNavigationError = await getNavigationError(page, data.url);
		if (pendingNavigationError && !hasNavigationRequestFailure(pageErrors, data.url)) pageErrors.push(pendingNavigationError);
		if (data.remainingNestedLevels !== 0) (await getLinksFromPage({
			page,
			baseUrl,
			discoveredLinks,
			exclusions
		})).forEach((link) => {
			if (discoveredLinks.has(link)) return;
			discoveredLinks.add(link);
			cluster.queue({
				url: link,
				parentUrl: data.url,
				remainingNestedLevels: data.remainingNestedLevels - 1
			});
		});
		const nonIgnoredPageErrors = await getNonIgnoredErrors(page, pageErrors);
		if (nonIgnoredPageErrors.length) throw createRetryableCrawlerError(data.url, nonIgnoredPageErrors);
	} finally {
		detachPageEventHandlers();
	}
}
async function getNavigationError(page, pageUrl) {
	try {
		await page.goto(pageUrl, { waitUntil: "load" });
		if (!pageUrl.includes("/api/")) await page.waitForNetworkIdle({ idleTime: 250 });
		return null;
	} catch (error) {
		const message = error?.message || "(empty message)";
		return {
			pageUrl,
			type: ERROR_TYPES.NAVIGATION_ERROR,
			message
		};
	}
}
async function getNonIgnoredErrors(page, pageErrors) {
	if (!pageErrors.length) return [];
	markErrorsAsIgnored(pageErrors, await getErrorIgnorePatternsFromPage(page));
	return pageErrors.filter((error) => !error.ignored);
}
function hasNavigationRequestFailure(pageErrors, pageUrl) {
	return pageErrors.some((pageError) => {
		return pageError.type === ERROR_TYPES.REQUEST_FAILURE && pageError.failedResourceUrl && areSameUrl(pageError.failedResourceUrl, pageUrl);
	});
}
/**
* Creates an error used to trigger a cluster-level retry when the page reported errors.
*/
function createRetryableCrawlerError(pageUrl, crawlerErrors) {
	const error = /* @__PURE__ */ new Error(`Error crawling ${pageUrl}: found ${crawlerErrors.length} page ${crawlerErrors.length > 1 ? "errors" : "error"}`);
	error.crawlerErrors = crawlerErrors;
	return error;
}
//#endregion
//#region src/crawler/run-crawler.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
/**
* Crawls the provided URL and all links found on the page. It uses Puppeteer to open the links in a headless browser and checks for errors.
*/
async function runCrawler(options) {
	console.log(styleText("bold", "\n🔎 Starting the Crawler…\n"));
	const { url, depth = Infinity, exclusions = [], timeout = DEFAULT_TIMEOUT, concurrency = DEFAULT_CONCURRENCY, reuseTabs = true, disableBrowserSandbox = false, ignoreHTTPSErrors = false, silent = false } = options;
	const discoveredLinks = /* @__PURE__ */ new Set([url]);
	const errors = createErrorStore();
	const baseUrl = getBaseUrl(url);
	const cluster = await createCrawlerCluster({
		timeout,
		concurrency,
		reuseTabs,
		disableBrowserSandbox,
		ignoreHTTPSErrors,
		silent,
		onError: createErrorCollector(errors)
	});
	await cluster.task(async ({ page, data }) => {
		busyPages.add(page);
		try {
			await processPage({
				page,
				data,
				cluster,
				baseUrl,
				discoveredLinks,
				exclusions
			});
		} finally {
			busyPages.delete(page);
		}
	});
	cluster.queue({
		url,
		parentUrl: "(none)",
		remainingNestedLevels: depth
	});
	await cluster.idle();
	await cluster.close();
	logErrors(errors);
	process.exit(errors.size ? 1 : 0);
}
//#endregion
//#region src/index.ts
/**
* @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
* For licensing, see LICENSE.md.
*/
//#endregion
export { DEFAULT_CONCURRENCY, DEFAULT_TIMEOUT, getBaseUrl, isUrlValid, runCrawler, toArray };
