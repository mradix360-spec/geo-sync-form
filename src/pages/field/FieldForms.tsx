import { FormsList } from "@/components/forms/FormsList";

const FieldForms = () => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground">My Forms</h2>
        <p className="text-muted-foreground">Tap a form to start collecting data</p>
      </div>
      <FormsList showHeader={false} />
    </div>
  );
};

export default FieldForms;
