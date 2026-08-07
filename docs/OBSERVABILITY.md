# Observability contract

Continuum correlates each evidence packet and action receipt with a W3C trace ID. The goal is to answer one incident question quickly: *which memories were admitted, rejected, and acted on in this trace?*

Recommended OpenTelemetry attributes:

| Attribute | Example | Content policy |
|---|---|---|
| `gen_ai.operation.name` | `execute_tool` | Safe |
| `gen_ai.provider.name` | `aws.bedrock` | Safe |
| `gen_ai.request.model` | `amazon.titan-embed-text-v2:0` | Safe |
| `continuum.enforcement_mode` | `shadow` | Safe |
| `continuum.policy.version` | `continuum-admissibility/0.2` | Safe |
| `continuum.memory.admitted_count` | `3` | Safe |
| `continuum.memory.rejected_count` | `1` | Safe |
| `continuum.human_review_required` | `true` | Safe |
| `continuum.receipt.id` | UUID | Safe within tenant controls |

Do not record raw queries, memory content, tool arguments, or model messages by default. GenAI telemetry fields can contain PII and secrets. Operators should opt in only with redaction, sampling, and retention controls.

## Useful service-level indicators

- Admission-decision latency p50/p95/p99.
- Percentage of requests in shadow vs enforce.
- Unsafe-recall class counts by policy version.
- Human-review rate and subsequent override rate.
- Receipt-write failures; target must be zero because no receipt means no decision.
- False-positive rate measured from reviewed shadow decisions.
