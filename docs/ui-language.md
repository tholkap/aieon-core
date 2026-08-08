# AiEON UI Language Map

Engineering terms used in code and internal tools mapped to business-facing language for user reports, landing pages, and customer communications.

The ten canonical questions in [business-understanding-framework.md](./business-understanding-framework.md) define what user-facing reports must answer. This document maps code fields to the labels used when presenting those answers.

Internal dev tools (`/discovery`) use engineering terms directly.

---

## Canonical Questions (Report Sections)

| # | Framework question | Report section heading |
|---|-------------------|------------------------|
| 1 | Who are they? | Who you are |
| 2 | What value do they create? | Value you create |
| 3 | What do they offer? | What you offer |
| 4 | Who do they help? | Who you help |
| 5 | What problems do they solve? | Problems you solve |
| 6 | Why choose them? | Why choose you |
| 7 | Why trust them? | Why trust you |
| 8 | Why should AI recommend them? | AI recommendation readiness |
| 9 | What can someone do next? | What visitors can do |
| 10 | How do they contribute to the world's understanding? | Your contribution to the field |

When a question cannot be answered from public evidence, use the section heading with a "Not found on your website" body—do not omit the section.

---

## Pipeline Stages

| Engineering term | Business-facing term | User-facing description |
|------------------|----------------------|-------------------------|
| Discovery | Website scan | We read your public website to collect factual signals. |
| Observation | Signal | A specific piece of text or metadata found on your site. |
| Interpretation | Identity matching | We compare signals from different parts of your site to identify your brand. |
| Evidence | Business profile data | Structured information about your business extracted from your site. |
| Reasoning | How we determined this | Plain-language explanation of why a value was assigned or left blank. |
| Resolved identity | Confirmed brand identity | The brand name supported by multiple independent signals on your site. |
| Candidate name | Possible brand name | A name found on your site that requires additional confirmation. |
| Confidence (identity) | Identity certainty | High when multiple parts of your site agree on your brand name; low when they do not. |
| Evidence gap | Missing information | A profile field we could not populate from your public site. |

---

## Identity Fields

| Code field (`ResolvedIdentity`) | Business-facing label | Notes for copy |
|---------------------------------|----------------------|----------------|
| `primaryBrand` | Primary brand name | Only shown when multiple site signals agree. |
| `legalBusinessName` | Legal business name | Shown only when explicitly stated (e.g., registration footer, structured data). |
| `tradingName` | Trading name | Shown only when explicitly stated and different from legal name. |
| `domain` | Website domain | e.g., `example.com` |
| `websiteTitle` | Page title | The HTML title tag as found on your homepage. |
| `candidateNames` | Names found on your site | List of possible brand names pending confirmation. |
| `operatingCountry` | Country of operation | Shown only when explicitly stated on your site. |
| `evidence` | Source signals | Internal audit reference; typically hidden from end users or shown in expandable detail. |
| `reasoning` | Analysis notes | Internal audit trail; summarize for users as "How we determined this." |

---

## Evidence Dimensions

| Code dimension | Business-facing name | What it covers |
|----------------|---------------------|----------------|
| `identity` | Who you are | Business name, contact details, mission, brand presentation |
| `knowledge` | What you offer | Products, services, value proposition, target audience |
| `trust` | Why customers trust you | Reviews, policies, certifications, transparency |
| `authority` | Why you're a credible source | Publications, awards, partnerships, case studies |
| `conversation` | How clearly you communicate | Audience fit, readability, call-to-action clarity |
| `action` | What visitors can do | Buy, book, contact, subscribe, and other pathways |

---

## Scoring Terms (Planned — Not Yet Implemented)

| Engineering term | Business-facing term | User-facing description |
|------------------|----------------------|-------------------------|
| Identity Ion | Brand clarity score | How clearly your site communicates who you are. |
| Understanding Ion | Offer clarity score | How clearly your site explains what you provide. |
| Trust Ion | Trust signal score | How strongly your site demonstrates credibility. |
| Authority Ion | Authority score | How well your site demonstrates expertise and recognition. |
| ConversAiEON | Message clarity | How effectively your site speaks to your intended audience. |
| AiEON Index | AiEON Index | Overall AI readiness score derived from the dimensions above. |

**Important:** These metrics are defined in UI mock (`AnalysisProgress.tsx`) but not calculated in code. Do not display numeric Ion values or AiEON Index to users until Milestone 5 (see `roadmap.md`).

---

## Observation Source Types

| Code `sourceType` | Business-facing term |
|-------------------|---------------------|
| `heading` | Page heading |
| `paragraph` | Body text |
| `metadata` | Page metadata |
| `schema` | Structured data |
| `image` | Image |
| `link` | Link |
| `button` | Button |
| `review` | Review or testimonial |
| `faq` | FAQ entry |

---

## Status and Empty States

| Engineering state | Business-facing message |
|-------------------|------------------------|
| Empty string field | Not found on your website |
| `confidence: 0` (identity) | Your site signals do not yet agree on a single brand name |
| `confidence: 1` (identity) | Multiple parts of your site confirm the same brand name |
| Fetch error | We couldn't access this website. Check the URL and try again. |
| Timeout | This website took too long to respond. |
| Non-200 response | This website returned an error and could not be analyzed. |
| Zero observations | We couldn't extract readable content from this page. |

Use em dash (`—`) or "Not found" in UI; never display empty strings without context.

---

## Terms to Avoid in User-Facing Copy

| Avoid | Prefer | Reason |
|-------|--------|--------|
| Hallucination | — (don't mention) | Internal engineering concern |
| LLM / AI model | AiEON analysis | Scoring AI is not in V1 pipeline |
| Selector | Source location | CSS selectors are implementation detail |
| Cheerio / parser | Website scan | Infrastructure detail |
| Observation ID | Reference | Internal audit identifier |
| Normalized name | Matched name | Implementation detail |
| Deterministic | Rule-based / transparent | Accurate but jargon-heavy |

---

## Internal vs External Surfaces

| Surface | Language register | Example |
|---------|-------------------|---------|
| `/discovery` | Engineering | "Resolved Identity", "Source Type", "Selector" |
| `/` landing | Business | "Discover how AI sees your business" |
| Future report | Business + expandable detail | "Primary brand name" with "View sources" disclosure |
| Logs (`DiscoveryRunner`) | Engineering | JSON events: `interpretation_completed` |

When adding new code fields, update this document before shipping user-facing labels.
