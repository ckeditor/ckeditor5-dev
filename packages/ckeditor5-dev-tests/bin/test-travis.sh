#!/usr/bin/env bash

npm run lint && \
node_modules/.bin/ckeditor5-dev-tests-check-dependencies && \
node --max_old_space_size=4096 node_modules/.bin/ckeditor5-dev-tests --coverage --reporter=dots --browsers=Chrome && \
node --max_old_space_size=4096 node_modules/.bin/ckeditor5-dev-tests --reporter=dots --browsers=Firefox,BrowserStack_Edge,BrowserStack_Safari
