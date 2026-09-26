import { load } from "cheerio";

export type PageKind = "policy" | "product" | "category" | "content" | "utility";

/** Scheduling hints only; these are never evidence of what a business offers. */
export function pageKind(url: string, label = "", productContext = false): PageKind {
  const parsed = new URL(url);
  const path = decodeURI(parsed.pathname).toLowerCase();
  if (/(?:^|\/)(?:cart|checkout|account|login|search|searchbar|wishlist|blocked)(?:\/|$)/.test(path)) return "utility";
  if (/shipping|delivery|warranty|refund|returns?|contact|about|faq/.test(path + " " + label.toLowerCase())) return "policy";
  if (productContext || /\/(?:products?|p)\//.test(path)) return "product";
  if (/\/(?:collections?|categor(?:y|ies))\b/.test(path)) return "category";
  return "content";
}

export function linkHints(html: string, base: string): Map<string, PageKind> {
  const $ = load(html);
  const hints = new Map<string, PageKind>();
  $("a[href]").each((_index, element) => {
    const anchor = $(element);
    try {
      const url = new URL(anchor.attr("href")!, base).href;
      const productContext = !!anchor.closest('[itemtype*="schema.org/Product"], .product-item, .product-card, .product, [data-product-id]').length;
      const kind = pageKind(url, anchor.text().trim(), productContext);
      if (!hints.has(url) || kind === "product") hints.set(url, kind);
    } catch { /* Invalid links do not enter the scheduler. */ }
  });
  return hints;
}

/** Balance page types so long menus cannot consume the entire development budget. */
export function selectNextPage(queue: string[], hints: Map<string, PageKind>, counts: Record<PageKind, number>): string {
  const base: Record<PageKind, number> = {policy: 0, product: 1, category: 2, content: 3, utility: 1000};
  let best = 0;
  let score = Infinity;
  for (let index = 0; index < queue.length; index++) {
    const kind = hints.get(queue[index]) ?? pageKind(queue[index]);
    const candidate = base[kind] + counts[kind] * 4 + (new URL(queue[index]).search ? 10 : 0);
    if (candidate < score) { best = index; score = candidate; }
  }
  const [url] = queue.splice(best, 1);
  counts[hints.get(url) ?? pageKind(url)]++;
  return url;
}
