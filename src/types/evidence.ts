/**
 * AiEON Evidence Model
 *
 * Type definitions for structured evidence collected during website analysis.
 * Each interface represents a dimension of discoverable signals that contribute
 * to understanding how a business presents itself to humans and AI systems.
 */

/**
 * Evidence related to who the business is — legal identity, brand presentation,
 * and primary contact surfaces.
 */
export interface IdentityEvidence {
  /** Registered or publicly stated legal business name. */
  businessName: string;

  /** Consumer-facing brand name when it differs from the legal entity. */
  brandName: string;

  /** URL or reference to the primary logo asset used in brand presentation. */
  logo: string;

  /** Short phrase summarizing the brand promise or positioning. */
  tagline: string;

  /** Central concept or thesis the organization communicates about itself. */
  coreIdea: string;

  /** Stated purpose — why the organization exists and whom it serves. */
  mission: string;

  /** Forward-looking statement of desired impact or long-term aspiration. */
  vision: string;

  /** Physical or mailing address associated with the business. */
  address: string;

  /** City component of the business location. */
  city: string;

  /** Country component of the business location. */
  country: string;

  /** Primary public telephone number for contact. */
  phone: string;

  /** Primary public email address for contact. */
  email: string;

  /** Canonical website URL for the organization. */
  website: string;

  /** Links or handles for official social media profiles. */
  socialProfiles: string[];

  /** Description of the primary audience the brand targets. */
  majorAudience: string;
}

/**
 * Evidence of what the business knows, offers, and delivers —
 * the substance behind its market positioning.
 */
export interface KnowledgeEvidence {
  /** Named products the organization sells or maintains. */
  products: string[];

  /** Services the organization provides to customers or clients. */
  services: string[];

  /** Industry verticals or sectors the business operates within. */
  industries: string[];

  /** Areas of specialized skill, competence, or deep experience. */
  expertise: string[];

  /** Unique selling proposition — what sets the offer apart from alternatives. */
  usp: string;

  /** Articulation of the value delivered to customers or stakeholders. */
  valueProposition: string;

  /** Customer pain points or challenges the offering is designed to address. */
  problemsSolved: string[];

  /** Results or benefits customers can reasonably expect after engagement. */
  expectedOutcomes: string[];

  /** How pricing is structured (e.g. subscription, one-time, tiered, custom). */
  pricingModel: string;

  /** How the offer is fulfilled (e.g. SaaS, on-site, hybrid, self-serve). */
  deliveryModel: string;

  /** Segments, personas, or markets the offering is aimed at. */
  targetAudience: string[];

  /** Concrete scenarios or applications where the offer applies. */
  useCases: string[];
}

/**
 * Evidence that supports credibility, reliability, and openness —
 * signals that reduce uncertainty for visitors and AI interpreters.
 */
export interface TrustEvidence {
  /** Customer or third-party reviews, ratings, or testimonial excerpts. */
  reviews: string[];

  /** Professional, industry, or compliance certifications held by the business. */
  certifications: string[];

  /** Published policies such as privacy, terms, refund, or shipping. */
  policies: string[];

  /** Indicators of openness — pricing visibility, team disclosure, process clarity. */
  transparency: string;

  /** Consistency of contact details across pages and external references. */
  contactConsistency: string;

  /** Recency signals — copyright dates, blog updates, news, version history. */
  freshness: string;

  /** Identifiable authors, bylines, or ownership attribution on content. */
  authorInformation: string;
}

/**
 * Evidence of external recognition, thought leadership, and demonstrated impact —
 * signals that the organization is a credible source in its domain.
 */
export interface AuthorityEvidence {
  /** Third-party references to the brand in media, directories, or listings. */
  mentions: string[];

  /** Inbound links or attributions from reputable external sources. */
  citations: string[];

  /** Articles, papers, books, or formal publications authored or contributed to. */
  publications: string[];

  /** Strategic alliances, integrations, or co-branded relationships. */
  partnerships: string[];

  /** Industry awards, rankings, or honors received. */
  awards: string[];

  /** Proprietary research, data, benchmarks, or whitepapers produced. */
  originalResearch: string[];

  /** Guides, tutorials, webinars, or other instructional material offered. */
  educationalContent: string[];

  /** Documented project outcomes with measurable business results. */
  caseStudies: string[];

  /** Narrative customer success stories or featured client profiles. */
  customerStories: string[];

  /** Assessment of depth, originality, and usefulness of published contributions. */
  contributionQuality: string;
}

/**
 * Evidence of how clearly the site communicates intent, audience fit,
 * and persuasive narrative — the conversational layer of the experience.
 */
export interface ConversationEvidence {
  /** Explicit or inferred description of the intended audience. */
  whoIsThisFor: string;

  /** Reasons or proof points given for selecting this provider over others. */
  whyChooseUs: string;

  /** Problems the copy positions the business as solving for the reader. */
  problemsSolved: string[];

  /** Distinctive traits, features, or claims that separate the offer. */
  differentiators: string[];

  /** How accessible and scannable the language is for the target reader. */
  readability: string;

  /** Overall coherence and lack of ambiguity in messaging. */
  clarity: string;

  /** How clearly the proposed solution and path to value are explained. */
  solutionClarity: string;

  /** How obvious and actionable the primary calls-to-action are. */
  ctaClarity: string;

  /** Confidence level in an AI-generated summary of the site's purpose and offer. */
  aiSummaryConfidence: string;
}

/**
 * Evidence of actionable pathways visitors can take —
 * concrete conversion, engagement, and interaction affordances.
 */
export interface ActionEvidence {
  /** Signals supporting a purchase or checkout action. */
  buy: string;

  /** Signals supporting appointment, demo, or consultation booking. */
  book: string;

  /** Signals supporting direct outreach via form, chat, or contact page. */
  contact: string;

  /** Signals supporting reservation of time, space, or inventory. */
  reserve: string;

  /** Signals supporting newsletter, plan, or membership signup. */
  subscribe: string;

  /** Signals supporting social sharing or referral of content. */
  share: string;

  /** Signals supporting deeper reading — articles, docs, or resource downloads. */
  read: string;

  /** Signals supporting account creation, login, or professional networking. */
  connect: string;

  /** Signals supporting user-generated content or account setup flows. */
  create: string;

  /** Signals supporting reactions, feedback, or expressive engagement. */
  emote: string;
}

/**
 * Root evidence container aggregating all AiEON analysis dimensions
 * for a single website or entity under review.
 */
export interface AiEONEvidence {
  /** Who the business is — identity, brand, and contact surfaces. */
  identity: IdentityEvidence;

  /** What the business offers and knows — products, services, and positioning. */
  knowledge: KnowledgeEvidence;

  /** Why the business can be trusted — credibility and transparency signals. */
  trust: TrustEvidence;

  /** Why the business is authoritative — external recognition and expertise. */
  authority: AuthorityEvidence;

  /** How the business communicates — clarity, narrative, and audience fit. */
  conversation: ConversationEvidence;

  /** What visitors can do — actionable pathways and conversion affordances. */
  action: ActionEvidence;
}
