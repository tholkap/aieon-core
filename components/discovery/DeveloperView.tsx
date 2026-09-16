import type { Observation } from "@/src/types/observation";
import type { ResolvedIdentity } from "@/src/types/resolved-identity";

const SOURCE_LABELS: Record<Observation["sourceType"], string> = {
  title: "Page title",
  "meta-description": "Meta description",
  h1: "Main heading (H1)",
  h2: "Section heading (H2)",
  h3: "Subsection heading (H3)",
  paragraph: "Body paragraph",
  "navigation-link": "Navigation link",
  "footer-link": "Footer link",
  button: "Button",
  "list-item": "List item",
  "json-ld": "JSON-LD",
  "organization-schema": "Organization schema",
  "product-schema": "Product schema",
  image: "Image",
  review: "Review",
  faq: "FAQ",
};

function ObservationCard({ observation }: { observation: Observation }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#081426] p-4 font-mono text-xs">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded bg-[#D4AF37]/15 px-2 py-0.5 text-[#D4AF37]">
          {observation.sourceType}
        </span>
        <span className="rounded bg-white/5 px-2 py-0.5 text-white/50">
          {SOURCE_LABELS[observation.sourceType]}
        </span>
      </div>
      <p className="mb-2 break-all text-white/40">{observation.selector}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
        {observation.rawValue}
      </p>
      <p className="mt-3 break-all text-[10px] text-white/30">{observation.id}</p>
    </article>
  );
}

export default function DeveloperView({
  observations,
  identity,
}: {
  observations: Observation[];
  identity: ResolvedIdentity;
}) {
  return (
    <details className="group w-full rounded-2xl border border-white/10 bg-white/[0.02]">
      <summary className="cursor-pointer list-none px-6 py-5 text-left marker:content-none">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              For engineers
            </p>
            <h3 className="mt-1 text-base font-medium text-white/80">
              Developer View
            </h3>
            <p className="mt-1 text-sm text-white/40">
              Observations, resolved identity, pipeline reasoning
            </p>
          </div>
          <span className="text-sm text-white/30 transition-transform group-open:rotate-180">
            ▼
          </span>
        </div>
      </summary>

      <div className="space-y-8 border-t border-white/10 px-6 py-6">
        <section>
          <h4 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/50">
            Pipeline
          </h4>
          <p className="font-mono text-xs leading-relaxed text-white/50">
            WebsiteFetcher → HtmlParser → IdentityInterpreter → (Evidence →
            Reasoning — not shown)
          </p>
        </section>

        <section>
          <h4 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/50">
            ResolvedIdentity
          </h4>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#081426] p-4 text-xs leading-relaxed text-white/70">
            {JSON.stringify(identity, null, 2)}
          </pre>
        </section>

        <section>
          <h4 className="mb-2 text-sm font-medium uppercase tracking-wider text-white/50">
            Observations ({observations.length})
          </h4>
          <p className="mb-4 text-sm text-white/40">
            Raw structural signals — sourceType describes HTML origin only.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {observations.map((observation) => (
              <ObservationCard key={observation.id} observation={observation} />
            ))}
          </div>
        </section>
      </div>
    </details>
  );
}
