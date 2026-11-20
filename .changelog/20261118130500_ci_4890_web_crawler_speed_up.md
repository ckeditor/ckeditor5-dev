---
type: Minor breaking change
scope:
  - ckeditor5-dev-web-crawler
---

The crawler now runs pages in `chrome-headless-shell` instead of the full Chrome browser, because it uses noticeably less CPU. With a default install, Puppeteer already downloads it. If you skip the download (for example, with `PUPPETEER_SKIP_DOWNLOAD`), install it with the `puppeteer browsers install chrome-headless-shell` command of the Puppeteer version that the crawler uses, or set `PUPPETEER_EXECUTABLE_PATH`. The full Chrome browser still works, but uses more CPU.

The crawler also checks pages faster. It reuses browser pages, and after a page loads, it waits until no request has been in progress for 250 ms instead of 500 ms.
