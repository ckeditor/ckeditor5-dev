#!/usr/bin/env bash

node_modules/.bin/ckeditor5-dev-tests-create-mgit-json && \
mgit bootstrap --repository-resolver=node_modules/@ckeditor/ckeditor5-dev-tests/lib/git-https-resolver.js && \
lerna init && \
lerna bootstrap
