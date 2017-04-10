#!/usr/bin/env bash

npm install gulp mgit2 lerna@^2.0.0.rc-1 codeclimate-test-reporter @ckeditor/ckeditor5-dev-lint && \
node_modules/.bin/ckeditor5-dev-tests-create-mgit-json && \
node_modules/.bin/ckeditor5-dev-tests-create-lerna-json && \
mgit bootstrap --recursive --resolver-path=@ckeditor/ckeditor5-dev-tests/lib/mgit-resolver.js && \
lerna init && \
lerna bootstrap
