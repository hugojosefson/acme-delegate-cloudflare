# acme-delegate-cloudflare

[![CI](https://github.com/hugojosefson/acme-delegate-cloudflare/actions/workflows/deno.yaml/badge.svg)](https://github.com/hugojosefson/acme-delegate-cloudflare/actions/workflows/deno.yaml)

Serves as an intermediary between internal clients using the
[HTTP request DNS Provider](https://go-acme.github.io/lego/dns/httpreq/) of
[Lego](https://go-acme.github.io/lego/), and the
[Cloudflare API](https://api.cloudflare.com/).

Runs a server internally, which listens for HTTP requests from Lego, and
forwards them to the Cloudflare API.

## Usage

### one-shot with Docker

```sh
docker run --rm -it \
  --env CF_API_EMAIL="..." \
  --env CF_API_KEY="..." \
  -p 443:443 \
  hugojosefson/acme-delegate-cloudflare
```

### with Docker Compose

```yaml
services:
  acme-delegate-cloudflare:
    image: hugojosefson/acme-delegate-cloudflare
    environment:
      CF_API_EMAIL: "..."
      CF_API_KEY: "..."
    ports:
      - "443:443"
```
