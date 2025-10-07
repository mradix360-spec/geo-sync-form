import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";

const MapViewer = () => {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId: string }>();
  const { user } = useAuth();

  const handleBack = () => {
    const isFieldStaff = user?.roles.includes('field_staff');
    navigate(isFieldStaff ? '/field' : '/analyst/maps');
  };

  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTitle, setFormTitle] = useState('');

  useEffect(() => {
    if (!formId) {
      handleBack();
      return;
    }
    loadResponses();
  }, [formId]);

  const loadResponses = async () => {
    try {
      // Load form info
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('title')
        .eq('id', formId)
        .single();

      if (formError) throw formError;
      setFormTitle(formData.title);

      // Load responses
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId);

      if (error) throw error;
      setResponses(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading responses",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await supabase.functions.invoke('export-geojson', {
        body: { formId }
      });

      if (response.error) throw response.error;

      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formTitle || 'export'}_${new Date().toISOString()}.geojson`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "GeoJSON file downloaded",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{formTitle}</h1>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export GeoJSON
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <MapView responses={responses} />
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            Responses ({responses.length})
          </h2>
          {responses.length === 0 ? (
            <p className="text-muted-foreground">No responses yet</p>
          ) : (
            <div className="grid gap-4">
              {responses.map((response) => (
                <div key={response.id} className="p-4 border rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(response.geojson.properties, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MapViewer;
