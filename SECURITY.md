# Security policy

Continuum is an early-stage reference implementation. Do not use it as the sole authorization control for production systems without an independent security review.

## Reporting a vulnerability

Do not open a public issue containing credentials, private memory content, tenant identifiers, or exploit details that could endanger a deployed system. Contact the repository owner privately through the security contact configured on their GitHub profile and include:

- affected commit and component;
- minimal reproduction without real customer data;
- expected and observed policy result;
- potential cross-tenant, integrity, availability, or privacy impact.

## Supported version

Only the latest commit on `main` is currently supported.

## Explicit limitations

- The demo's prompt-injection detector is a bounded heuristic.
- Hash-linked receipts detect unexpected modification; they do not replace signed external log export.
- The application must authenticate tenant identity before calling the Lambda adapter.
- Cloud roles, network policy, secrets, encryption, backup, and incident response remain deployment-owner responsibilities.
