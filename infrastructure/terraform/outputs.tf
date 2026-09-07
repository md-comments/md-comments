output "worker_id" {
  description = "The ID of the provisioned Cloudflare Worker"
  value       = cloudflare_worker_script.telemetry_proxy.id
}

output "telemetry_endpoint" {
  description = "The public telemetry endpoint URL to configure in client interfaces"
  value       = var.custom_domain != "" ? "https://${var.custom_domain}/v1/logs" : "https://${var.worker_name}.${var.workers_subdomain}.workers.dev/v1/logs"
}
