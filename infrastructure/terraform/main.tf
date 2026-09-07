terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.30.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# 1. Cloudflare Worker Script Resource
resource "cloudflare_worker_script" "telemetry_proxy" {
  account_id = var.cloudflare_account_id
  name       = var.worker_name
  content    = file("${path.module}/../telemetry-proxy/dist/worker.js")

  module              = true
  compatibility_date  = "2024-09-01"

  plain_text_binding {
    name = "UPSTREAM_OTLP_ENDPOINT"
    text = var.upstream_otlp_endpoint
  }

  plain_text_binding {
    name = "MAX_REQUESTS_PER_MINUTE"
    text = tostring(var.rate_limit_per_minute)
  }

  plain_text_binding {
    name = "ALLOWED_ORIGINS"
    text = var.allowed_origins
  }

  dynamic "secret_text_binding" {
    for_each = var.upstream_auth_header != "" ? [1] : []
    content {
      name = "UPSTREAM_AUTH_HEADER"
      text = var.upstream_auth_header
    }
  }
}

# 2. Enable workers.dev Subdomain Route
resource "terraform_data" "enable_subdomain" {
  depends_on = [cloudflare_worker_script.telemetry_proxy]

  triggers_replace = [
    cloudflare_worker_script.telemetry_proxy.id
  ]

  provisioner "local-exec" {
    command = "curl -s -X POST 'https://api.cloudflare.com/client/v4/accounts/${var.cloudflare_account_id}/workers/scripts/${cloudflare_worker_script.telemetry_proxy.name}/subdomain' -H 'Authorization: Bearer ${var.cloudflare_api_token}' -H 'Content-Type: application/json' -d '{\"enabled\":true}'"
  }
}

# 3. Optional Custom Domain Mapping (workers.dev works out-of-the-box with 0 DNS)
resource "cloudflare_worker_domain" "custom_domain" {
  count      = var.custom_domain != "" ? 1 : 0
  account_id = var.cloudflare_account_id
  hostname   = var.custom_domain
  service    = cloudflare_worker_script.telemetry_proxy.name
  zone_id    = var.cloudflare_zone_id
}
