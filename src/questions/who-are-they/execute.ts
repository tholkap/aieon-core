import type { BusinessQuestionEngine } from "@/src/questions/shared/BusinessQuestionEngine";
import type { BusinessQuestionStatus } from "@/src/questions/shared/types";

export const execute: BusinessQuestionEngine = (
  _observations,
  resolvedIdentity,
) => {
  const details: string[] = [];

  if (resolvedIdentity.primaryBrand) {
    details.push(`Primary brand: ${resolvedIdentity.primaryBrand}`);
  }

  if (resolvedIdentity.legalBusinessName) {
    details.push(`Legal name: ${resolvedIdentity.legalBusinessName}`);
  }

  if (resolvedIdentity.domain) {
    details.push(`Website: ${resolvedIdentity.domain}`);
  }

  if (resolvedIdentity.websiteTitle) {
    details.push(`Page title: ${resolvedIdentity.websiteTitle}`);
  }

  if (resolvedIdentity.candidateNames.length > 0) {
    details.push(
      `Other names found: ${resolvedIdentity.candidateNames.join(", ")}`,
    );
  }

  let summary: string;
  let status: BusinessQuestionStatus;

  if (resolvedIdentity.primaryBrand) {
    summary = resolvedIdentity.primaryBrand;
    status = "found";
  } else if (
    resolvedIdentity.candidateNames.length > 0 ||
    resolvedIdentity.websiteTitle
  ) {
    summary =
      "Your site mentions several possible brand names, but they do not yet agree strongly enough to confirm one primary identity.";
    status = "partial";
  } else if (resolvedIdentity.domain) {
    summary = `We could identify the website domain (${resolvedIdentity.domain}) but no clear brand name from page content.`;
    status = "partial";
  } else {
    summary = "Not found on your website";
    status = "missing";
  }

  return {
    id: "who",
    question: "Who are they?",
    sectionTitle: "Who you are",
    summary,
    details,
    status,
    howDetermined:
      resolvedIdentity.reasoning.length > 0
        ? resolvedIdentity.reasoning
        : undefined,
  };
};
