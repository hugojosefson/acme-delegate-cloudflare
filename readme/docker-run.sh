#!/usr/bin/env bash

docker run --rm -it \
  --env CF_API_EMAIL="..." \
  --env CF_API_KEY="..." \
  -p 443:443 \
  hugojosefson/acme-delegate-cloudflare
