# ConverSimple documentation

Source for [docs.conversimple.com](https://docs.conversimple.com), built with Mintlify. The documentation is organized by the job a customer is trying to do: add voice to an existing SaaS concierge, embed an agent, connect a phone line, or run Python tools.

The current site content was rewritten against the platform and SDK sources reviewed on 2 October 2026. This branch is a draft; content only reaches the public site when merged into the branch connected to Mintlify.

## Preview and checks

From this directory:

```bash
mint dev
mint validate
mint broken-links
mint openapi-check reference/openapi.yaml
```

The Existing Concierge Voice example is in `examples/concierge-saas`:

```bash
cd examples/concierge-saas
npm install
npm test
```

Mintlify provides `/llms.txt`, `/llms-full.txt`, and plain Markdown versions of pages automatically. Do not maintain separate prose for agents; make the public page precise enough for both humans and agents.

## Sources and writing rules

- The current platform routes, controller contracts, deployment UI, widget client, and provider configuration live in `ProjectTathastu/conversimple`.
- The published Python package source lives in `ProjectTathastu/conversimple-sdk`; check the installed distribution version separately from an in-source `__version__` constant.
- Keep internal architecture notes and test reports in the platform repo. Public docs describe supported customer actions and their limits.
- State who owns each action: ConverSimple, the customer's browser, or the customer's backend. Distinguish speech generation from observed browser playback and physical audibility.
- Every quickstart needs prerequisites, a bounded job, exact setup steps, a success check, failure behavior, and links to its reference contract.
- Do not claim a provider, model, language, latency, live transfer, or campaign capability from a UI label alone. Verify source and an end-to-end scenario for the exact surface.
- Update the OpenAPI file and affected guides when a public route, response, SDK method, or browser event changes. Review examples against real signatures and keep secrets out of sample output.
- Use stable page paths and add redirects when replacing a page. Run the local checks before publishing.

The historical 2025 SDK pages remain in the repository for provenance but are outside the current navigation and redirected where they have a current equivalent. Do not use them as the source for new customer claims.
