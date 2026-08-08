# AiEON Business Understanding Framework

The Business Understanding Framework defines the canonical questions AiEON must answer about a business. Every discovery extractor, interpreter, evidence mapper, and report section maps to one or more of these questions.

The framework is **question-driven**, not score-driven. Ions and the AiEON Index (planned) measure how well each question is answered—not substitute for answering them.

## Framework Structure

Each question follows the same documentation contract:

| Section | Description |
|---------|-------------|
| **Purpose** | Why this question matters to AI systems and business operators |
| **Evidence sources** | Observation types and pages where answers may be found |
| **Interpreter responsibilities** | What the interpretation layer must produce |
| **Reasoning principles** | Deterministic rules governing resolution |
| **Business-friendly output** | How the answer appears in user-facing reports |
| **Future AI enhancements** | Optional downstream capabilities—not implemented in Foundation |

## Question Index

| # | Canonical question | Primary evidence dimension | Interpreter (planned/current) |
|---|-------------------|---------------------------|-------------------------------|
| 1 | Who are they? | `identity` | `IdentityInterpreter` (V1) |
| 2 | What value do they create? | `knowledge` | `ValueInterpreter` (planned) |
| 3 | What do they offer? | `knowledge` | `OfferingInterpreter` (planned) |
| 4 | Who do they help? | `knowledge`, `identity`, `conversation` | `AudienceInterpreter` (planned) |
| 5 | What problems do they solve? | `knowledge`, `conversation` | `ProblemInterpreter` (planned) |
| 6 | Why choose them? | `knowledge`, `conversation` | `DifferentiationInterpreter` (planned) |
| 7 | Why trust them? | `trust` | `TrustInterpreter` (planned) |
| 8 | Why should AI recommend them? | composite | `RecommendationInterpreter` (planned) |
| 9 | What can someone do next? | `action` | `ActionInterpreter` (planned) |
| 10 | How do they contribute to the world's understanding? | `authority` | `AuthorityInterpreter` (planned) |

## Pipeline Position

```
Observations → Interpreters (per question cluster) → Evidence (AiEONEvidence) → Reasoning (Ions) → Report
```

Foundation implements Question 1 partially via `IdentityInterpreter`. Questions 2–10 are specified here and reflected in `AiEONEvidence` types; interpreters are not yet implemented.

---

## Question 1: Who are they?

### Purpose

Establish the legal and brand identity of the business—name, domain, contact surfaces, and organizational self-description. AI assistants use identity signals to disambiguate businesses with similar names and to attribute content correctly.

Without resolved identity, downstream questions (audience, trust, recommendation) lack a stable subject.

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| HTML `<title>` | `metadata` | `"Acme Corp \| Enterprise Software"` |
| First `<h1>` | `heading` | `"Welcome to Acme"` |
| Meta tags | `metadata` | `og:site_name`, `application-name` |
| JSON-LD Organization | `schema` | `name`, `legalName`, `url`, `logo` |
| Footer | `paragraph` | Copyright line, registered entity |
| Contact page | `paragraph`, `link` | Stated business name, address |
| Logo | `image` | Alt text, filename |
| External listings | future adapter | Google Business Profile, LinkedIn company page |

**V1 implemented:** title, first H1 (via `HtmlParser`).

### Interpreter responsibilities

`IdentityInterpreter` (implemented V1):

- Collect name candidates from title (full text + prefix before `|` or `-`) and first H1
- Resolve `primaryBrand` only when ≥2 observations agree on normalized name
- Extract `domain` from page URL hostname
- Record verbatim `websiteTitle`
- Leave `legalBusinessName`, `tradingName`, `operatingCountry` empty without explicit evidence
- Emit `reasoning[]` and `evidence[]` (observation IDs)

**Target evidence fields:** `identity.businessName`, `identity.brandName`, `identity.website`, `identity.logo`, `identity.mission`, `identity.vision`, contact fields.

### Reasoning principles

- Never resolve identity from a single observation
- Never infer legal name from brand name or domain
- Prefer explicit structured data (`legalName`) over inferred copy
- Surface conflicts (e.g., title ≠ H1 ≠ JSON-LD) in reasoning rather than picking silently
- Empty output preferred over guessed output

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `primaryBrand` | Primary brand name |
| `legalBusinessName` | Legal business name |
| `domain` | Website domain |
| `websiteTitle` | Page title |

See `ui-language.md` for empty-state messaging.

### Future AI enhancements (not implemented)

- Disambiguate intentionally different title vs H1 when JSON-LD provides authoritative name
- Normalize transliterations and abbreviations across sources (with cited observations)
- Detect parent/subsidiary relationships from corporate structure pages

AI must not assign `legalBusinessName` without observation-backed explicit evidence.

---

## Question 2: What value do they create?

### Purpose

Capture the outcome or benefit the business delivers—not the product name, but the value articulation. AI systems use this to match user intent ("I need X") to business capability ("we deliver Y").

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| First `<h1>` | `heading` | Hero headline stating primary value |
| Hero paragraph | `paragraph` | Subheadline below H1 |
| Meta description | `metadata` | Summary value statement |
| About page | `paragraph`, `heading` | Mission-aligned value copy |
| JSON-LD | `schema` | `description`, `slogan` |
| Pricing page headers | `heading` | Tier value framing |

**V1 implemented:** first H1 mapped to `knowledge.valueProposition` via `EvidenceBuilder` (unwired).

### Interpreter responsibilities

`ValueInterpreter` (planned):

- Extract candidate value statements from hero and metadata observations
- Prefer H1 when present; corroborate with meta description when aligned
- Map to `knowledge.valueProposition`, `knowledge.expectedOutcomes`
- Do not paraphrase—store verbatim observation text or rule-derived segments
- Flag inconsistency when H1 and meta description diverge

### Reasoning principles

- Verbatim extraction first; synthesis only when multiple observations state identical normalized meaning
- Do not infer value from product names alone
- Leave empty when no hero or description observation exists
- Meta description alone is insufficient for high-confidence value resolution (single observation)

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `valueProposition` | Value proposition |
| `expectedOutcomes` | Expected outcomes |

### Future AI enhancements (not implemented)

- Summarize multi-paragraph hero sections into a single cited value statement
- Compare stated value against case study outcomes for consistency scoring
- Multilingual value extraction with source language tagging

---

## Question 3: What do they offer?

### Purpose

Identify concrete products and services the business sells or provides. AI recommendation requires knowing *what* can be purchased or engaged—not just brand identity.

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| Navigation menus | `link` | Product/service category links |
| Product pages | `heading`, `paragraph` | Product names, descriptions |
| Services sections | `heading`, `list` | Service offerings |
| JSON-LD | `schema` | `Product`, `Service`, `Offer` |
| Pricing tables | `paragraph`, `heading` | Plan names, feature lists |
| FAQ | `faq` | "What services do you offer?" |

**V1 implemented:** none (fields empty in `KnowledgeEvidence`).

### Interpreter responsibilities

`OfferingInterpreter` (planned):

- Extract named products and services as string arrays
- Deduplicate normalized names; preserve display casing from first observation
- Map to `knowledge.products`, `knowledge.services`, `knowledge.industries`
- Record `knowledge.pricingModel`, `knowledge.deliveryModel` when explicitly stated
- Link each offering to supporting observation IDs

### Reasoning principles

- Each array entry must trace to at least one observation
- Do not infer offerings from industry keywords alone
- Navigation link text is a candidate, not confirmation—corroborate with destination page content when multi-page discovery is available
- Generic terms ("Solutions", "Services") alone are not valid offerings

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `products` | Products |
| `services` | Services |
| `pricingModel` | Pricing model |
| `deliveryModel` | Delivery model |

### Future AI enhancements (not implemented)

- Cluster synonymous product names across pages
- Infer product categories from schema.org types
- Detect discontinued offerings from stale pages vs current navigation

---

## Question 4: Who do they help?

### Purpose

Define the target audience, customer segments, and personas the business explicitly addresses. AI uses audience fit to filter recommendations ("best for small businesses", "enterprise teams").

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| Hero copy | `paragraph`, `heading` | "Built for marketing teams" |
| Dedicated audience sections | `heading`, `paragraph` | "Who we serve" |
| Case study headers | `heading` | Customer segment labels |
| JSON-LD | `schema` | `audience`, `areaServed` |
| Meta keywords | `metadata` | Legacy audience hints (low weight) |
| Identity fields | `identity.majorAudience` | Stated primary audience |

**V1 implemented:** none.

### Interpreter responsibilities

`AudienceInterpreter` (planned):

- Extract explicit audience descriptors from copy and schema
- Map to `knowledge.targetAudience`, `identity.majorAudience`, `conversation.whoIsThisFor`
- Require verbatim or rule-extracted phrases—not demographic inference
- Consolidate only when multiple observations use identical normalized phrasing

### Reasoning principles

- Do not infer audience from TLD, language, or currency alone
- Single vague phrase ("everyone", "businesses") recorded as candidate with low resolution confidence
- B2B vs B2C hints require explicit copy ("for developers", "for consumers")
- Cross-check audience claims against case study customer types when available

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `targetAudience` | Target audience |
| `whoIsThisFor` | Who this is for |
| `majorAudience` | Primary audience |

### Future AI enhancements (not implemented)

- Persona construction from multiple page sections with per-persona evidence links
- Audience–offering fit matrix for recommendation scoring
- Detect audience mismatch between homepage and product pages

---

## Question 5: What problems do they solve?

### Purpose

Document the customer pain points and challenges the business claims to address. AI assistants map user problems to businesses that explicitly solve them.

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| Problem/solution sections | `heading`, `paragraph` | "Struggling with X? We help by..." |
| FAQ | `faq` | Problem-oriented questions |
| Case studies | `paragraph` | Before-state problem descriptions |
| JSON-LD FAQPage | `schema` | Structured Q&A |
| Feature comparison copy | `paragraph` | Pain point framing |

**V1 implemented:** none (`knowledge.problemsSolved`, `conversation.problemsSolved` empty).

### Interpreter responsibilities

`ProblemInterpreter` (planned):

- Extract problem statements as string arrays
- Map to `knowledge.problemsSolved` and `conversation.problemsSolved`
- Distinguish problems (inputs) from outcomes (outputs)—do not conflate with Question 2
- Tag each problem with observation provenance

### Reasoning principles

- Problems must appear in source copy—not inferred from product category
- "We are a CRM" does not imply "contact management chaos" without explicit statement
- Duplicate problems across sections merged only on normalized exact match
- FAQ questions ending in "?" are candidates; answers required for confirmation

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `problemsSolved` | Problems solved |

### Future AI enhancements (not implemented)

- Problem clustering across FAQ and marketing copy
- Problem–solution pairing validation (each problem linked to stated solution)
- Competitive problem framing detection (vs named competitors)

---

## Question 6: Why choose them?

### Purpose

Capture differentiation—unique selling propositions, competitive advantages, and explicit "why us" arguments. Supports AI comparison queries ("why pick A over B").

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| "Why choose us" sections | `heading`, `paragraph` | Differentiator bullets |
| Comparison pages | `paragraph` | Feature advantage tables |
| Testimonials | `review` | Customer-stated reasons |
| USP callouts | `paragraph`, `heading` | Taglines, proof points |
| JSON-LD | `schema` | `award`, `slogan` |

**V1 implemented:** none (`knowledge.usp`, `conversation.whyChooseUs`, `conversation.differentiators` empty).

### Interpreter responsibilities

`DifferentiationInterpreter` (planned):

- Extract USP and differentiator lists
- Map to `knowledge.usp`, `conversation.whyChooseUs`, `conversation.differentiators`
- Preserve verbatim differentiator text
- Flag unsubstantiated superlatives ("best", "#1") without supporting evidence observations

### Reasoning principles

- Marketing claims without supporting observations recorded as copy, not verified facts
- Testimonials are attributed differentiators, not independent verification
- Do not infer differentiation from feature lists alone
- Conflicting USPs across pages surfaced in reasoning

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `usp` | Unique selling proposition |
| `whyChooseUs` | Why choose this business |
| `differentiators` | Key differentiators |

### Future AI enhancements (not implemented)

- Cross-reference claimed differentiators against review sentiment
- Competitive differentiation extraction when comparison pages name competitors
- Substantiation scoring for quantified claims ("10x faster" → look for benchmark source)

---

## Question 7: Why trust them?

### Purpose

Assess credibility signals—reviews, policies, certifications, transparency, freshness, and contact consistency. AI systems reduce recommendation risk when trust evidence is present and consistent.

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| Review widgets | `review` | Star ratings, testimonial text |
| Policy pages | `link`, `paragraph` | Privacy, terms, refund policies |
| Certification badges | `image`, `paragraph` | ISO, industry certifications |
| Contact information | `paragraph`, `link` | Phone, email, address across pages |
| Copyright/footer dates | `paragraph` | Freshness signals |
| Author/byline | `paragraph`, `metadata` | Content attribution |
| SSL/security badges | `image` | Trust seals |

**V1 implemented:** none (`TrustEvidence` fields empty).

### Interpreter responsibilities

`TrustInterpreter` (planned):

- Populate `trust.reviews`, `trust.certifications`, `trust.policies`
- Assess `trust.contactConsistency` by comparing contact observations across pages
- Record `trust.freshness` from dated signals (copyright, blog dates)
- Evaluate `trust.transparency` from pricing visibility, team disclosure
- Never fabricate reviews or certifications

### Reasoning principles

- Third-party review embeds preferred over self-authored testimonial blocks
- Missing policy pages are absence signals, not negative proof
- Contact inconsistency (different emails on contact vs footer) flagged explicitly
- Self-reported certifications require observation of badge or named standard

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `reviews` | Customer reviews |
| `certifications` | Certifications |
| `policies` | Published policies |
| `transparency` | Transparency assessment |
| `contactConsistency` | Contact consistency |

### Future AI enhancements (not implemented)

- Review sentiment aggregation with source attribution
- Policy completeness checklist (privacy, terms, cookies, refund)
- Domain age and certificate metadata as supplementary signals

---

## Question 8: Why should AI recommend them?

### Purpose

Synthesize whether the business presents sufficient clarity, authority, and trust for an AI assistant to recommend it confidently. This is a **composite question**—it depends on answers to Questions 1–7 and conversation quality.

It maps to recommendation-readiness, not a marketing endorsement.

### Evidence sources

Composite—draws from all dimensions:

| Input | Contributing questions |
|-------|------------------------|
| Identity clarity | Q1 |
| Value and offering clarity | Q2, Q3 |
| Audience and problem fit | Q4, Q5 |
| Differentiation | Q6 |
| Trust signals | Q7 |
| Messaging quality | `conversation` dimension |
| Authority signals | Q10 |

**V1 implemented:** `conversation.aiSummaryConfidence` field exists; no interpreter populates it.

### Interpreter responsibilities

`RecommendationInterpreter` (planned):

- Evaluate evidence completeness per dimension required for safe recommendation
- Populate `conversation.aiSummaryConfidence` as structured assessment (not LLM guess in V1)
- Produce recommendation-readiness reasoning: which questions are answered vs gaps
- Feed `src/core/reasoning/` for AiEON Index (Milestone 5)
- Do not output "recommend" / "do not recommend" binary without documented criteria

### Reasoning principles

- Recommendation-readiness requires minimum evidence thresholds (to be defined in scoring ADR)
- Missing identity (Q1 unresolved) blocks high recommendation confidence
- Single-dimension strength does not compensate for missing trust (Q7) in high-stakes categories
- AI summary confidence is not populated by an LLM in Foundation or Milestone 3

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `aiSummaryConfidence` | AI understanding confidence |
| Composite report section | Recommendation readiness |

### Future AI enhancements (not implemented)

- LLM-generated summary strictly constrained to cited evidence (with hallucination checks)
- Category-specific recommendation thresholds (healthcare vs retail)
- Simulation against sample user queries to test recommendation fit

LLM output is always downstream of evidence—not a source of evidence.

---

## Question 9: What can someone do next?

### Purpose

Identify actionable pathways—buy, book, contact, subscribe, download—and how visible they are. AI agents and assistants need to know what actions a user can take on behalf of the customer.

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| CTA buttons | `button` | "Buy now", "Start trial" |
| Primary links | `link` | "Contact sales", "Book demo" |
| Forms | `paragraph`, `link` | Newsletter signup, contact form |
| JSON-LD | `schema` | `potentialAction`, `BuyAction` |
| Navigation | `link` | Cart, login, signup paths |
| Phone/mailto links | `link` | Direct contact affordances |

**V1 implemented:** none (`ActionEvidence` fields empty).

### Interpreter responsibilities

`ActionInterpreter` (planned):

- Map observations to `action.buy`, `action.book`, `action.contact`, etc.
- Record signal summary per action type (e.g., presence of checkout link)
- Assess `conversation.ctaClarity` alongside action evidence
- Distinguish primary vs footer CTAs when selector depth allows

### Reasoning principles

- Action evidence describes presence and label of affordances—not conversion rates
- "Learn more" alone is weak `read` signal; require destination context
- Multiple competing primary CTAs reduce clarity score (documented in reasoning)
- Login/signup mapped to `connect` / `create` per `ActionEvidence` schema

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `buy` | Purchase pathway |
| `book` | Booking pathway |
| `contact` | Contact pathway |
| `subscribe` | Subscribe pathway |
| `ctaClarity` | Call-to-action clarity |

### Future AI enhancements (not implemented)

- Action path depth ("buy" → cart → checkout steps detectable)
- Agent-executable action identification (API, structured forms)
- Mobile vs desktop CTA visibility comparison

---

## Question 10: How do they contribute to the world's understanding?

### Purpose

Capture authority and thought-leadership signals—publications, research, education, awards, partnerships, and case studies. AI systems weight authoritative sources higher when seeking expert recommendations.

### Evidence sources

| Source | Observation types | Examples |
|--------|-------------------|----------|
| Blog/resources | `link`, `heading` | Articles, whitepapers, guides |
| Case studies | `paragraph`, `heading` | Customer outcomes |
| Press/awards sections | `paragraph`, `image` | Award badges, media logos |
| External citations | future adapter | Inbound links, mentions |
| JSON-LD | `schema` | `Article`, `ScholarlyArticle` |
| Team credentials | `paragraph` | Author bios, credentials |
| Open source / research | `link` | GitHub, published datasets |

**V1 implemented:** none (`AuthorityEvidence` fields empty).

### Interpreter responsibilities

`AuthorityInterpreter` (planned):

- Populate `authority.publications`, `authority.caseStudies`, `authority.awards`, etc.
- Assess `authority.contributionQuality` from depth signals (word count, originality markers—deterministic heuristics only)
- Map educational content to `authority.educationalContent`
- Record partnerships and mentions when explicitly named

### Reasoning principles

- Self-published blog posts are contributions, not third-party validation
- Logo walls ("As seen in") require named entities in observation text
- Case studies require identifiable customer or outcome statements
- Contribution quality is assessed relative to observed content depth—not domain reputation inference

### Business-friendly output

| Field | User-facing label |
|-------|-------------------|
| `publications` | Publications |
| `caseStudies` | Case studies |
| `awards` | Awards and recognition |
| `educationalContent` | Educational resources |
| `contributionQuality` | Contribution quality |

### Future AI enhancements (not implemented)

- External mention verification via search API
- Citation graph for original research
- Expertise topic modeling tied to observed content corpus

---

## Implementation Status Summary

| Question | Interpreter | Evidence populated | Wired to pipeline |
|----------|-------------|-------------------|-------------------|
| 1. Who are they? | `IdentityInterpreter` V1 | Partial (`ResolvedIdentity`) | Yes |
| 2. What value do they create? | — | Partial (`valueProposition` in builder only) | No |
| 3. What do they offer? | — | No | No |
| 4. Who do they help? | — | No | No |
| 5. What problems do they solve? | — | No | No |
| 6. Why choose them? | — | No | No |
| 7. Why trust them? | — | No | No |
| 8. Why should AI recommend them? | — | No | No |
| 9. What can someone do next? | — | No | No |
| 10. How do they contribute? | — | No | No |

## Related Documents

- [philosophy.md](./philosophy.md) — principles interpreters must obey
- [architecture.md](./architecture.md) — pipeline layers and modules
- [ui-language.md](./ui-language.md) — business-facing output labels
- [roadmap.md](./roadmap.md) — milestone schedule for interpreter implementation
