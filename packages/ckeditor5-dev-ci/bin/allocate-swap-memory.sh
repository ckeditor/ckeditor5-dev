#!/bin/bash

# @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
# For licensing, see LICENSE.md.

echo "Allocating swap memory to prevent running out of RAM."

# Remove existing swap so that allocating new swap does not throw.
sudo swapoff -a

# Create a 4 gigabyte swapfile.
sudo fallocate -l 4G /swapfile

# Secure the swapfile by restricting access to root.
sudo chmod 600 /swapfile

# Mark the file as a swap space.
sudo mkswap /swapfile

# Enable the swap.
sudo swapon /swapfile
