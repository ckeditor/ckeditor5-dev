#!/usr/bin/env bash

node_modules/.bin/ckeditor5-dev-tests-create-mgit-json && \
node_modules/.bin/ckeditor5-dev-tests-create-lerna-json && \
cat mgit.json && \
#mkdir packages && \
#ln -s $TRAVIS_BUILD_DIR $TRAVIS_BUILD_DIR/packages/$(basename "$PWD") && \
mgit bootstrap --recursive --repository-resolver=node_modules/@ckeditor/ckeditor5-dev-tests/lib/git-https-resolver.js && \
lerna init && \
cat lerna.json && \
lerna bootstrap && \
ls -la node_modules/@ckeditor
