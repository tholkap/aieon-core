# AiEON Constitution

Permanent engineering principles for the AiEON Framework. All modules, types, interpreters, and user-facing surfaces must conform to this document.

Where other documentation conflicts with this constitution, this document prevails.

**Status:** Accepted  
**Scope:** AiEON Core — discovery, interpretation, evidence, scoring, reporting  
**Related documents:** [business-understanding-framework.md](./business-understanding-framework.md), [architecture.md](./architecture.md), [ui-language.md](./ui-language.md)

---

## 1. Mission

AiEON answers ten canonical questions about a business using public evidence so AI systems can understand, compare, and recommend without guessing.

The questions—defined in [business-understanding-framework.md](./business-understanding-framework.md)—cover identity, value, offerings, audience, problems, differentiation, trust, recommendation-readiness, action pathways, and authority.

AiEON is an evidence system. Its output is a structured, auditable profile where every populated field traces to observations and documented rules, or is explicitly empty. AiEON does not generate business facts, marketing copy, or opaque scores.

Engineering success is measured by pipeline integrity and framework coverage—not by the fluency of generated text or the number of populated fields on incomplete evidence.

---

## 2. Core Philosophy

These principles are permanent. They apply to all current and future work.

### Observation before interpretation

Raw facts are collected before any meaning is assigned. An observation is an unmodified value with provenance (page URL, selector, source type, timestamp). Interpretation consumes observations; it does not fetch pages, parse HTML, or alter observation records.

### Evidence before confidence

Structured evidence is assembled from observations according to documented rules. Confidence reflects how well evidence supports a conclusion—it never substitutes for missing evidence.

### Deterministic reasoning before LLM reasoning

Explicit, reproducible rules are the baseline for every interpreter and evidence mapper. LLMs may augment downstream work only after deterministic baselines exist and only under the constraints in Section 8.

### Every conclusion must explain itself

Every interpreter and engine emits a reasoning log describing what was found, what was applied, and why fields remain empty. Reasoning is a required output, not debug metadata.

### Multiple independent evidence sources strengthen confidence

Conclusions that depend on identity or high-stakes claims require corroboration from at least two independent observations or sources. A single DOM element or page section is a candidate, not a resolved fact.

### Missing evidence is acceptable

Absence of a page element, structured data block, or external listing is normal. Empty fields are valid output. The system continues processing when evidence is partial.

### Never invent business facts

If a value is not present in source material and no explicit rule extracts it, the output is empty. Inference from domain TLD, language, product category, or model prior is prohibited.

### Business questions remain stable while evidence sources evolve

The ten framework questions are the stable contract. Extractors, observation types, and external adapters may expand over time. Questions do not change when new sources are added.

### Internal terminology may differ from customer terminology

Engineering types and dev tools use precise terms (`Observation`, `ResolvedIdentity`, `selector`). User-facing reports use business language defined in [ui-language.md](./ui-language.md). The mapping is explicit and maintained.

### Every engine must produce explainable output

No module may emit conclusions without traceable inputs. Fetchers, parsers, interpreters, evidence builders, scorers, and report generators each document their inputs, outputs, and decision path.

---

## 3. Architecture Principles

AiEON is organized as a strict layered pipeline. Each layer has a single responsibility and explicit exclusions.

```
Transport → Discovery → Interpretation → Evidence → Reasoning → Report
```

| Layer | Input | Output | Must not |
|-------|-------|--------|----------|
| Transport (`WebsiteFetcher`) | URL | Raw HTML | Parse, interpret, score |
| Discovery (`HtmlParser`, future extractors) | HTML | `Observation[]` | Interpret, map evidence, score |
| Interpretation (`IdentityInterpreter`, future interpreters) | `Observation[]` | Resolved profiles | Fetch, parse, invent values |
| Evidence (`EvidenceBuilder`, `DiscoveryEngine`) | Observations, resolved profiles | `AiEONEvidence` | Calculate Ions |
| Reasoning (planned) | `AiEONEvidence` | Scores, readiness assessments | Fetch, parse, fill empty fields |
| Report (planned) | Evidence, scores | User-facing output | Modify evidence |

**Rules:**

- Layer boundaries are not crossed. Violations do not merge.
- All work maps to at least one framework question (Q1–Q10).
- The `/discovery` dev tool runs the same server-side pipeline as production analysis.
- Website fetching is server-side only (no client-side CORS workarounds).
- Fail open on absence: missing elements are skipped silently.
- Fail closed on error: invalid URLs, network failures, timeouts, and non-200 responses halt and surface errors.

---

## 4. Evidence Principles

Evidence is structured data mapped from observations by documented, deterministic rules.

### Definition

An `Observation` is a raw signal. `AiEONEvidence` and resolved profile types (`ResolvedIdentity`, `ResolvedBusinessUnderstanding`) are interpreted structures organized by framework question and evidence dimension.

### Rules

- Every populated evidence field must link to one or more observation IDs.
- Empty evidence fields remain empty strings or empty arrays—never placeholders or guesses.
- Evidence mappers do not calculate Ions or recommendation scores.
- Six evidence dimensions (`identity`, `knowledge`, `trust`, `authority`, `conversation`, `action`) reflect distinct facets of business presence; fields are not conflated across dimensions without documented mapping.
- New evidence fields require framework question mapping before implementation.
- Missing evidence is acceptable and expected on most sites for most fields.

### Prohibited

- Populating `legalBusinessName`, `operatingCountry`, or similar fields without explicit source statements
- Treating SEO title text as legal entity name without corroboration
- Using confidence scores to fill evidence gaps

---

## 5. Interpretation Principles

Interpretation transforms observations into resolved profiles using question-specific interpreters.

### Current interpreters

| Interpreter | Framework questions | Output type | Status |
|-------------|--------------------|-------------|--------|
| `IdentityInterpreter` | Q1 — Who are they? | `ResolvedIdentity` | V1 implemented |
| Future: `ValueInterpreter`, `OfferingInterpreter`, etc. | Q2–Q6 | `ResolvedBusinessUnderstanding` | Specified, not implemented |

### Rules

- Interpreters read `Observation[]` only—they do not call fetch or parse APIs.
- Identity-critical fields (e.g., `primaryBrand`) require agreement from ≥2 independent observations with the same normalized value.
- Candidate values are stored even when resolution fails (e.g., `candidateNames`).
- Every interpreter emits:
  - `evidence[]` — observation IDs evaluated
  - `reasoning[]` — step-by-step deterministic decisions
  - `confidence` — resolution indicator, not an Ion score
- Verbatim extraction is preferred over paraphrase. Normalization applies only for equality comparison, not display.
- Conflicts between sources are recorded in reasoning, not silently resolved.

### Prohibited

- Single-observation resolution for multi-source fields
- Fuzzy matching or embedding similarity in Foundation milestones
- LLM-generated field values in place of rule-based extraction

---

## 6. UI Principles

User interfaces serve two registers: internal engineering validation and external business reporting.

### Internal surfaces (e.g., `/discovery`)

- Display engineering terms: `Observation`, `ResolvedIdentity`, `sourceType`, `selector`
- Show raw values, reasoning arrays, and evidence IDs for audit
- Run the production server-side pipeline without dev-only shortcuts

### External surfaces (reports, landing page results)

- Use business language from [ui-language.md](./ui-language.md)
- Map each report section to a framework question (Q1–Q10)
- Empty fields display explicit empty states ("Not found on your website")—not blank strings
- Support expandable "how we determined this" disclosure tied to reasoning
- Do not display Ion scores or AiEON Index until scoring logic is implemented and constitution-compliant (Section 7)

### Terminology separation

| Internal | External |
|----------|----------|
| Observation | Signal |
| Resolved identity | Confirmed brand identity |
| Evidence gap | Missing information |
| Reasoning | How we determined this |

Internal terminology may differ from customer terminology. The mapping in `ui-language.md` is authoritative and must be updated when new fields ship.

### Prohibited in user-facing UI

- Presenting guessed or LLM-invented values as extracted facts
- Hiding empty framework questions entirely
- Exposing CSS selectors or observation IDs without user context (optional audit expando only)

---

## 7. Scoring Principles

Ions and the AiEON Index measure how completely and consistently a business answers the framework questions. They do not replace those answers.

### Current state

Scoring is **not implemented**. Step labels in `AnalysisProgress.tsx` (Identity Ion, Understanding Ion, Trust Ion, Authority Ion, ConversAiEON, AiEON Index) are UI placeholders only.

### Rules (binding when scoring is built)

- No score ships before evidence population and reasoning infrastructure exist.
- Every score decomposes to specific evidence fields and documented formulas (ADR-required).
- Scores are computed after evidence assembly—evidence before confidence applies to scoring as well.
- Insufficient evidence produces a documented gap or suppressed score—not an inferred number.
- `ResolvedIdentity.confidence` and `ResolvedBusinessUnderstanding.confidence` are resolution indicators, not Ion scores.
- Q8 ("Why should AI recommend them?") is a composite assessment derived from Q1–Q7 and Q10 evidence—not a standalone LLM judgment.

### Prohibited

- Model confidence as a substitute for evidence-based scoring
- Composite indexes that cannot be decomposed field-by-field
- Displaying scores to end users without accompanying evidence disclosure

---

## 8. Future AI Principles

AI and LLMs may be introduced only as optional, downstream enhancements subordinate to the evidence pipeline. None of the following is implemented in Foundation.

### Permitted (future)

- Summarization strictly constrained to cited observations and evidence fields
- Cross-page consistency analysis with per-claim source attribution
- Query simulation for recommendation-readiness (Q8) against stored evidence
- Disambiguation assistance when structured data conflicts with page copy—output cites observations, does not override them silently

### Prerequisites before any AI ships

1. Deterministic interpreter baseline for the relevant framework question
2. Documented entry under "Future AI enhancements" in [business-understanding-framework.md](./business-understanding-framework.md)
3. ADR describing inputs, outputs, constraints, and failure modes
4. Human-auditable reasoning for every AI-assisted field

### Prohibited (permanent)

- LLM-as-parser replacing Cheerio or structured extractors
- LLM-as-interpreter replacing deterministic rules for required fields
- End-to-end URL-to-report prompts that bypass `Observation[]`
- Using an LLM as the sole source for any required field
- Generating business facts to populate empty evidence fields
- Scores derived from model logits rather than evidence rules

Deterministic reasoning before LLM reasoning is permanent policy. AI augments; it does not define ground truth.

---

## Compliance Checklist

Before merging code that touches discovery, interpretation, evidence, scoring, or UI:

- [ ] Observation before interpretation — no parsing in interpreters
- [ ] Evidence before confidence — no confidence-filling of empty fields
- [ ] Deterministic rules used for required fields
- [ ] `reasoning[]` and `evidence[]` emitted where applicable
- [ ] Multi-source corroboration where required by framework
- [ ] Empty output preferred over invented values
- [ ] Maps to framework question Q1–Q10
- [ ] User-facing labels checked against `ui-language.md`
- [ ] No LLM dependency for core pipeline stages

---

## Document Hierarchy

| Document | Role |
|----------|------|
| **aieon-constitution.md** (this file) | Permanent principles |
| [business-understanding-framework.md](./business-understanding-framework.md) | Question specifications |
| [philosophy.md](./philosophy.md) | Extended engineering guidance |
| [architecture.md](./architecture.md) | Module and pipeline reference |
| [ui-language.md](./ui-language.md) | Internal ↔ customer terminology |
| [adr/](./adr/) | Specific technical decisions |

Amendments to this constitution require explicit review and documentation updates.
