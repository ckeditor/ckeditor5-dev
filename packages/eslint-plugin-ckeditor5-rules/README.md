CKEditor 5 ESLint Plugins
=========================

A set of plugins used by the [CKEditor 5](https://ckeditor.com) team for [Eslint](https://eslint.org/) 

By default this plugin is added to our [`eslint-config-ckeditor5`](https://www.npmjs.com/package/eslint-config-ckeditor5) preset. 

## Usage

```
npm i --save-dev eslint-plugin-ckeditor5-rules
```

Configure ESLint with a `.eslintrc` file using the following contents:

```js
{
	// ...
	plugins: [
		// ...
		'ckeditor5-rules' // Add the plugin to the linter.
	],
	rules: {
		'ckeditor5-rules/no-relative-imports': 'error'
		// ...
	}
	// ...
}
```

## Rules

### no-relative-imports

A rule that inspects for relative imports to other [CKEditor 5](https://ckeditor.com)'s packages:

```js
// Incorrect import:
import Position from '../../ckeditor5-engine/src/model/position';

// Will be fix to: 
import Position from '@ckeditor/ckeditor5-engine/src/model/position';
```

## Changelog

See the [`CHANGELOG.md`](https://github.com/ckeditor/ckeditor5-dev/blob/master/packages/eslint-plugin-ckeditor5-rules/CHANGELOG.md) file.
