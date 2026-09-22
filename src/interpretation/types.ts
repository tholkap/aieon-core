export interface Citation { sourceId: string; quote: string }
export interface InterpretationContent {
  summary: string;
  summaryCitations: Citation[];
  findings: { title: string; explanation: string; customerQuestion: string; suggestedChange: string; factsToConfirm: string; citations: Citation[] }[];
}
export type InterpretationResult =
  | { status: "not-configured" | "unavailable" | "limited" }
  | { status: "complete"; content: InterpretationContent; model: string; snapshotId: string; promptVersion: string; generatedAt: string; sourceCount: number; omittedCount: number; sources: { id: string; pageUrl: string; selector: string; text: string }[] };
