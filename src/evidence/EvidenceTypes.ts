export interface HeroEvidence {
  brandName?: string;
  mainHeadline?: string;
  supportingHeadline?: string;
  primaryCallToAction?: string;
}

export interface SupportingMessageEvidence {
  metaDescription?: string;
  sectionHeadings: string[];
}

export interface NavigationEvidence {
  primaryLinks: string[];
}

export interface CtaEvidence {
  callToActions: string[];
}

export interface FooterEvidence {
  links: string[];
}

export interface WebsiteEvidence {
  hero?: HeroEvidence;
  supportingMessage?: SupportingMessageEvidence;
  navigation?: NavigationEvidence;
  cta?: CtaEvidence;
  footer?: FooterEvidence;
}
