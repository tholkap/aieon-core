import type { ContentZone, ContentZoneType } from "@/src/content-zones/ContentZoneTypes";
import type { Observation, ObservationSourceType } from "@/src/types/observation";

import type {
  CtaEvidence,
  FooterEvidence,
  HeroEvidence,
  NavigationEvidence,
  SupportingMessageEvidence,
  WebsiteEvidence,
} from "./EvidenceTypes";

function findZone(
  zones: ContentZone[],
  type: ContentZoneType,
): ContentZone | undefined {
  return zones.find((zone) => zone.type === type);
}

function firstObservationValue(
  observations: Observation[],
  sourceType: ObservationSourceType,
): string | undefined {
  const observation = observations.find(
    (item) => item.sourceType === sourceType,
  );
  const value = observation?.rawValue.trim();

  return value ? value : undefined;
}

function observationValuesInOrder(
  observations: Observation[],
  sourceType: ObservationSourceType,
): string[] {
  return observations
    .filter((item) => item.sourceType === sourceType)
    .map((item) => item.rawValue.trim())
    .filter((value) => value.length > 0);
}

function buildHeroEvidence(zone: ContentZone): HeroEvidence | undefined {
  const title = firstObservationValue(zone.observations, "title");
  const h1 = firstObservationValue(zone.observations, "h1");
  const h2 = firstObservationValue(zone.observations, "h2");
  const button = firstObservationValue(zone.observations, "button");

  const hero: HeroEvidence = {};

  const brandName = title ?? h1;

  if (brandName) {
    hero.brandName = brandName;
  }

  if (h1) {
    hero.mainHeadline = h1;
  }

  if (h2) {
    hero.supportingHeadline = h2;
  }

  if (button) {
    hero.primaryCallToAction = button;
  }

  if (
    hero.brandName === undefined &&
    hero.mainHeadline === undefined &&
    hero.supportingHeadline === undefined &&
    hero.primaryCallToAction === undefined
  ) {
    return undefined;
  }

  return hero;
}

function buildSupportingMessageEvidence(
  zone: ContentZone,
): SupportingMessageEvidence | undefined {
  const metaDescription = firstObservationValue(
    zone.observations,
    "meta-description",
  );
  const sectionHeadings = observationValuesInOrder(zone.observations, "h3");

  if (!metaDescription && sectionHeadings.length === 0) {
    return undefined;
  }

  return {
    metaDescription,
    sectionHeadings,
  };
}

function buildNavigationEvidence(
  zone: ContentZone,
): NavigationEvidence | undefined {
  const primaryLinks = observationValuesInOrder(
    zone.observations,
    "navigation-link",
  );

  if (primaryLinks.length === 0) {
    return undefined;
  }

  return { primaryLinks };
}

function buildCtaEvidence(zone: ContentZone): CtaEvidence | undefined {
  const callToActions = observationValuesInOrder(zone.observations, "button");

  if (callToActions.length === 0) {
    return undefined;
  }

  return { callToActions };
}

function buildFooterEvidence(zone: ContentZone): FooterEvidence | undefined {
  const links = observationValuesInOrder(zone.observations, "footer-link");

  if (links.length === 0) {
    return undefined;
  }

  return { links };
}

/**
 * Transforms content zones into structured website evidence.
 */
export function buildWebsiteEvidence(zones: ContentZone[]): WebsiteEvidence {
  const evidence: WebsiteEvidence = {};

  const heroZone = findZone(zones, "hero");
  const supportingMessageZone = findZone(zones, "supporting-message");
  const navigationZone = findZone(zones, "navigation");
  const ctaZone = findZone(zones, "cta");
  const footerZone = findZone(zones, "footer");

  if (heroZone) {
    const hero = buildHeroEvidence(heroZone);

    if (hero) {
      evidence.hero = hero;
    }
  }

  if (supportingMessageZone) {
    const supportingMessage = buildSupportingMessageEvidence(
      supportingMessageZone,
    );

    if (supportingMessage) {
      evidence.supportingMessage = supportingMessage;
    }
  }

  if (navigationZone) {
    const navigation = buildNavigationEvidence(navigationZone);

    if (navigation) {
      evidence.navigation = navigation;
    }
  }

  if (ctaZone) {
    const cta = buildCtaEvidence(ctaZone);

    if (cta) {
      evidence.cta = cta;
    }
  }

  if (footerZone) {
    const footer = buildFooterEvidence(footerZone);

    if (footer) {
      evidence.footer = footer;
    }
  }

  return evidence;
}
