# AiEON Documentation

Engineering and product documentation for the AiEON Business Understanding Framework and analysis pipeline.

## Core Documents

| Document | Description |
|----------|-------------|
| [aieon-constitution.md](./aieon-constitution.md) | **Supreme governing rules** — non-negotiable framework law |
| [vision.md](./vision.md) | Mission, problem statement, long-term vision |
| [philosophy.md](./philosophy.md) | Engineering principles and constraints |
| [architecture.md](./architecture.md) | Pipeline layers, modules, types, data flow |
| [business-understanding-framework.md](./business-understanding-framework.md) | **Canonical Q1–Q10 questions** — purpose, sources, interpreters, output |
| [ui-language.md](./ui-language.md) | Engineering term → business language mapping |
| [roadmap.md](./roadmap.md) | Milestones from Foundation to Public Beta |

## Architecture Decision Records

See [adr/](./adr/) for recorded technical decisions.

## Quick Reference

**Active pipeline:**

```
URL → WebsiteFetcher → HtmlParser → IdentityInterpreter → { observations, resolvedIdentity }
```

**Framework questions (ten):**

1. Who are they?
2. What value do they create?
3. What do they offer?
4. Who do they help?
5. What problems do they solve?
6. Why choose them?
7. Why trust them?
8. Why should AI recommend them?
9. What can someone do next?
10. How do they contribute to the world's understanding?

**Internal validation:** [`/discovery`](../app/discovery/page.tsx)

## Conventions

| Term | Meaning |
|------|---------|
| Implemented | Code exists and is callable |
| Wired | Connected to orchestrator or page |
| Specified | Documented in framework; no code yet |
| Stub | Interface defined; returns empty data |

## Contributing

When adding interpreters or extractors:

1. Map work to framework question(s) in [business-understanding-framework.md](./business-understanding-framework.md)
2. Update [architecture.md](./architecture.md) module reference
3. Add business-facing labels to [ui-language.md](./ui-language.md)
4. Update milestone status in [roadmap.md](./roadmap.md)
