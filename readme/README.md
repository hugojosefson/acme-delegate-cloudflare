# acme-delegate-cloudflare

| 🚧️👷 Under construction 👷🚧️ |
| ---------------------------- |

Intermediary between internal ACME clients using the
[HTTP request DNS Provider](https://go-acme.github.io/lego/dns/httpreq/) of
[Lego](https://go-acme.github.io/lego/), and the
[Cloudflare API](https://api.cloudflare.com/).

Run this as a server on your internal network. It listens for HTTP requests from
Lego on your other internal servers, and forwards them to the Cloudflare API.

This server will be the only one that needs to have access to your Cloudflare
API key.

[![CI](https://github.com/hugojosefson/acme-delegate-cloudflare/actions/workflows/deno.yaml/badge.svg)](https://github.com/hugojosefson/acme-delegate-cloudflare/actions/workflows/deno.yaml)

## Usage

### one-shot with Docker

```sh
@@include(./docker-run.sh)
```

### with Docker Compose

```yaml
@@include(./docker-compose.yml)
```
