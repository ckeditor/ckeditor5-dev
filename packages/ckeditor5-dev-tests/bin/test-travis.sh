#!/usr/bin/env bash

node_modules/.bin/ckeditor5-dev-tests-install-dependencies && \
node_modules/.bin/gulp lint && \
node_modules/.bin/ckeditor5-dev-tests --coverage --reporter=dots
