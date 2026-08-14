export type BusinessQuestionStatus = "found" | "partial" | "missing";

export interface BusinessQuestion {
  id: string;
  question: string;
  sectionTitle: string;
  summary: string;
  details: string[];
  status: BusinessQuestionStatus;
  howDetermined?: string[];
}
