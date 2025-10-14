import { QuickActions } from "@/components/shared/QuickActions";
import { ContentShareTabs } from "@/components/forms/ContentShareTabs";
import { AIResponseAnalysis } from "@/components/forms/AIResponseAnalysis";

const FormsView = () => {
  return (
    <div className="space-y-6">
      <QuickActions />
      <AIResponseAnalysis />
      <ContentShareTabs />
    </div>
  );
};

export default FormsView;
