---
id: 'INV-TELEMETRY-KILLSWITCH'
description: 'Users have the unconditional ability to disable telemetry across all interfaces with immediate buffer purging and zero network traffic.'
enforcementMechanism: 'TelemetryKillSwitch runtime controller, Options toggle switches, VS Code telemetryLevel listeners, and DO_NOT_TRACK compliance.'
---

# Invariant: Universal Telemetry Kill-Switch

When telemetry is toggled off in client settings or signaled via DO_NOT_TRACK, the telemetry subsystem must immediately cease all network egress, discard in-memory buffers, purge persistent storage queues, and act as a total no-op.
