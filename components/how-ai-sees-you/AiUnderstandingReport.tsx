import InterpretationSection from "./InterpretationSection";
import BlindSpotsSection from "@/components/how-ai-sees-you/BlindSpotsSection";
import BusinessQuestionsSection from "@/components/how-ai-sees-you/BusinessQuestionsSection";
import type { AiUnderstandingReport as Report } from "@/components/how-ai-sees-you/mapAiUnderstanding";
import ReadinessSummary from "@/components/how-ai-sees-you/ReadinessSummary";
import RecommendationsSection from "@/components/how-ai-sees-you/RecommendationsSection";
import UnderstandingSummary from "@/components/how-ai-sees-you/UnderstandingSummary";

export default function AiUnderstandingReportView({
  report,
}: {
  report: Report;
}) {
  return (
    <div className="space-y-16">
      <UnderstandingSummary report={report} />
      <InterpretationSection result={report.interpretation} />
      <BusinessQuestionsSection report={report} />
      <BlindSpotsSection report={report} />
      <RecommendationsSection report={report} />
      <ReadinessSummary report={report} />
    </div>
  );
}
