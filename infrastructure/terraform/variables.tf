variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID from dashboard overview"
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API Token with Workers Scripts:Edit permissions"
}

variable "worker_name" {
  type        = string
  description = "Name of the Cloudflare Worker"
  default     = "md-comments-telemetry-proxy"
}

variable "upstream_otlp_endpoint" {
  type        = string
  description = "Upstream Grafana Cloud or SigNoz OTLP HTTP endpoint"
  default     = "https://otlp-gateway-prod-us-east-0.grafana.net/otlp"
}

variable "upstream_auth_header" {
  type        = string
  sensitive   = true
  description = "Upstream Authorization header (e.g. Basic MTIzNDU2OmdsY19leU...)"
  default     = ""
}

variable "rate_limit_per_minute" {
  type        = number
  description = "Maximum allowed requests per minute per client IP"
  default     = 20
}

variable "allowed_origins" {
  type        = string
  description = "Comma-separated list of allowed CORS origins or * for open proxy"
  default     = "*"
}

variable "custom_domain" {
  type        = string
  description = "Optional custom domain (e.g. telemetry.md-comments.org). Leave empty for workers.dev default."
  default     = ""
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Zone ID if using custom domain"
  default     = ""
}

variable "workers_subdomain" {
  type        = string
  description = "Cloudflare Workers subdomain (e.g. md-comments)"
  default     = "md-comments"
}
