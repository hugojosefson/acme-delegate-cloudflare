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
@@include(./docker-run.sh)
```

### with Docker Compose

```yaml
@@include(./docker-compose.yml)
```
