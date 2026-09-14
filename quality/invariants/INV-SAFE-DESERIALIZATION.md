---
id: 'INV-SAFE-DESERIALIZATION'
description: 'All YAML deserialization across all clients and backends must enforce strict JSON schema validation to prevent code execution and prototype pollution.'
enforcementMechanism: 'Static analysis checking schema: yaml.JSON_SCHEMA in all yaml.load calls and unit test fuzzing.'
---

# Invariant: Safe Deserialization Schema

Comment storage formats use YAML on custom git refs. To eliminate arbitrary object instantiation, code execution, or prototype pollution vulnerabilities, all YAML parser invocations (`yaml.load`) across the monorepo must explicitly specify `{ schema: yaml.JSON_SCHEMA }`.
