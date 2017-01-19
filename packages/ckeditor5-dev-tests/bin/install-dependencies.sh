#!/usr/bin/env bash

node_modules/.bin/ckeditor5-dev-tests-create-mgit-json && \
node_modules/.bin/ckeditor5-dev-tests-create-lerna-json && \
mgit bootstrap --recursive --repository-resolver=@ckeditor/ckeditor5-dev-tests/lib/git-https-resolver.js && \
lerna init && \
lerna bootstrap
