import { QuickActions } from "@/components/shared/QuickActions";
import { FormsList } from "@/components/forms/FormsList";

const FormsView = () => {
  return (
    <div className="space-y-6">
      <QuickActions />
      <FormsList />
    </div>
  );
};

export default FormsView;
