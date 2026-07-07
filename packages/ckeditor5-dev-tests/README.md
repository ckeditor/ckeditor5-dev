CKEditor 5 testing environment
==============================

[![npm version](https://badge.fury.io/js/%40ckeditor%2Fckeditor5-dev-tests.svg)](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests)
[![CircleCI](https://circleci.com/gh/ckeditor/ckeditor5-dev.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/ckeditor5-dev?branch=master)

Testing environment for [CKEditor 5](https://ckeditor.com). It provides the custom [Vitest](https://vitest.dev/) matchers used by the automated tests. It's normally used in the [CKEditor 5 development environment](https://github.com/ckeditor/ckeditor5). Read more about [CKEditor 5's testing environment](https://docs.ckeditor.com/ckeditor5/latest/framework/guides/contributing/testing-environment.html).

More information about development tools packages can be found at the following URL: <https://github.com/ckeditor/ckeditor5-dev>.

## Usage

First, you need to install the package:

```bash
npm i --save-dev @ckeditor/ckeditor5-dev-tests
```

## Custom Vitest matchers

The `toEqualMarkup()` matcher tests whether two given strings containing markup language are equal, formatting the markup before showing a diff. Register it in a Vitest setup file:

```js
import { expect } from 'vitest';
import { toEqualMarkup } from '@ckeditor/ckeditor5-dev-tests';

expect.extend( { toEqualMarkup } );
```

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/ckeditor5-dev-tests/CHANGELOG.md) file.

## License

Licensed under the terms of [GNU General Public License Version 2 or later](http://www.gnu.org/licenses/gpl.html). For full details about the license, please check the `LICENSE.md` file.
