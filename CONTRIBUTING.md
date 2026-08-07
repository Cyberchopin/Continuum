# Contributing

Continuum welcomes narrow, evidence-backed improvements to memory admission, evaluation, auditability, and deployment safety.

1. Open an issue describing the unsafe-recall class or adoption problem.
2. Add or update a scenario in `evals/memory-gauntlet.json`.
3. Implement the smallest policy change that makes the scenario pass.
4. Run `npm run lint`, `npm test`, and `npm run eval`.
5. Explain false-positive risk and any security tradeoff in the pull request.

Never add real memory records, credentials, account identifiers, diagnosis details, or customer data to fixtures.
