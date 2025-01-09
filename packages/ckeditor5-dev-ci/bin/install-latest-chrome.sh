#!/bin/bash

# @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
# For licensing, see LICENSE.md.

echo "Installing the latest Chrome."

sudo apt-get update
sudo apt-get install lsb-release libappindicator3-1
curl -L -o google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome.deb
sudo sed -i 's|HERE/chrome"|HERE/chrome" --no-sandbox|g' /opt/google/chrome/google-chrome
rm google-chrome.deb
