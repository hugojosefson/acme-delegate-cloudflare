#!/usr/bin/env bash
# create and enter a directory for the script
mkdir -p "acme-delegate-cloudflare"
cd       "acme-delegate-cloudflare"

# download+extract the script, into current directory
curl -fsSL "https://github.com/hugojosefson/acme-delegate-cloudflare/tarball/main" \
  | tar -xzv --strip-components=1
