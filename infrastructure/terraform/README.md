# Cloudflare Worker Telemetry Proxy Terraform IaC

This Terraform module provisions the serverless **Cloudflare Worker Telemetry Proxy** for Markdown Comments. It relays OpenTelemetry exception logs from client applications (Chrome/Safari extensions, Desktop IDEs, Obsidian, Web Embeds) to upstream APM backends (Grafana Cloud, SigNoz) with **zero client secrets** and **quota abuse defense**.

## Prerequisites

1. **Cloudflare Account ID**: Found on your Cloudflare dashboard overview.
2. **Cloudflare API Token**: Created at `https://dash.cloudflare.com/profile/api-tokens` with template **Edit Cloudflare Workers** (`Workers Scripts:Edit`, `Account Settings:Read`).
3. **Upstream APM Credentials**: Your free Grafana Cloud or SigNoz OTLP endpoint and Auth header.

## Deployment with Terraform

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
2. Fill in your credentials in `terraform.tfvars` (or configure in `.env`).
3. Initialize and apply:
   ```bash
   terraform init
   terraform apply
   ```
4. Copy the resulting `telemetry_endpoint` output URL into your client configuration.

## Deployment with Wrangler (Zero-Terraform Alternative)

If you prefer deploying directly using Cloudflare's CLI:

```bash
cd ../telemetry-proxy
pnpm install
npx wrangler secret put UPSTREAM_AUTH_HEADER
npx wrangler deploy
```
