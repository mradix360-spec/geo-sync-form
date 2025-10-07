import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { offlineStorage } from "@/lib/offlineStorage";

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface Form {
  id: string;
  title: string;
  description: string;
  geometry_type: string;
  schema: { fields: FormField[] };
}

const FormSubmit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formId } = useParams<{ formId: string }>();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  useEffect(() => {
    if (!formId) {
      navigate('/dashboard');
      return;
    }
    loadForm();
    captureLocation();
  }, [formId]);

  const loadForm = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title, description, geometry_type, schema')
        .eq('id', formId)
        .single();

      if (error) throw error;
      
      // Parse the schema JSON
      const parsedForm: Form = {
        ...data,
        schema: typeof data.schema === 'string' 
          ? JSON.parse(data.schema) 
          : data.schema as unknown as { fields: FormField[] }
      };
      
      setForm(parsedForm);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading form",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !location) return;

    setSubmitting(true);
    try {
      // Generate client_id for idempotency
      const clientId = `${user?.id || 'anonymous'}_${formId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        },
        properties: {
          ...formData,
          _client_id: clientId
        }
      };

      // Try to submit online
      const { error } = await supabase
        .from('form_responses')
        .insert({
          form_id: formId,
          user_id: user?.id,
          geojson,
          client_id: clientId,
          synced: navigator.onLine,
        });

      if (error && !navigator.onLine) {
        // Store offline with client_id
        await offlineStorage.addSubmission({
          id: clientId,
          formId: formId!,
          geojson,
          timestamp: Date.now(),
          synced: false,
        });
        toast({
          title: "Saved offline",
          description: "Your submission will sync when online",
        });
      } else if (error) {
        throw error;
      } else {
        toast({
          title: "Form submitted!",
          description: "Your response has been recorded",
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error submitting form",
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!form) {
    return <div className="flex items-center justify-center min-h-screen">Form not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            <CardDescription>{form.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Status */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <MapPin className="w-4 h-4" />
                {location ? (
                  <span className="text-sm">
                    Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-sm text-destructive">
                    {locationError || 'Capturing location...'}
                  </span>
                )}
              </div>

              {/* Dynamic Fields */}
              {form.schema.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && '*'}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    />
                  )}
                </div>
              ))}

              <Button type="submit" disabled={submitting || !location} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FormSubmit;
