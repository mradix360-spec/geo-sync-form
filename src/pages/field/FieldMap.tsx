import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/MapView";
import { Loader2 } from "lucide-react";

const FieldMap = () => {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllResponses();
  }, []);

  const loadAllResponses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("form_responses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error("Error loading responses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-card border-b border-border">
        <h2 className="text-xl font-bold text-foreground">All Submissions</h2>
        <p className="text-sm text-muted-foreground">
          {responses.length} submission{responses.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1">
        <MapView responses={responses} />
      </div>
    </div>
  );
};

export default FieldMap;
