import { FormsList } from "@/components/forms/FormsList";
import { FieldStats } from "@/components/field/FieldStats";
import { Sparkles } from "lucide-react";

const FieldForms = () => {
  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">My Forms</h2>
            <p className="text-sm text-muted-foreground">Tap a form to start collecting data</p>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <FieldStats />
      </div>
      
      {/* Forms List */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <FormsList showHeader={false} />
      </div>
    </div>
  );
};

export default FieldForms;
