import { FormsList } from "@/components/forms/FormsList";
import { FieldStats } from "@/components/field/FieldStats";

const FieldForms = () => {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Forms</h2>
        <p className="text-muted-foreground">Tap a form to start collecting data</p>
      </div>
      
      <FieldStats />
      
      <FormsList showHeader={false} />
    </div>
  );
};

export default FieldForms;
