export interface Citation { sourceId: string; quote: string }
export interface InterpretationContent {
  summary: string;
  summaryCitations: Citation[];
  findings: { title: string; explanation: string; customerQuestion: string; suggestedChange: string; factsToConfirm: string; citations: Citation[] }[];
}
export type InterpretationFailure = "access" | "quota" | "request" | "model" | "provider" | "timeout" | "network" | "incomplete" | "blocked" | "format" | "evidence" | "size" | "empty";
export type InterpretationResult =
  | { status: "not-configured" | "unavailable" | "limited"; reason?: InterpretationFailure }
  | { status: "complete"; content: InterpretationContent; model: string; snapshotId: string; promptVersion: string; generatedAt: string; sourceCount: number; omittedCount: number; sources: { id: string; pageUrl: string; selector: string; text: string }[] };
