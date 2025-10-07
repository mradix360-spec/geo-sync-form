import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { MapPin } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface Form {
  id: string;
  title: string;
  schema: {
    fields: FormField[];
  };
}

export default function EmbedFormViewer() {
  const { token } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadForm();
    captureLocation();
  }, [token]);

  const loadForm = async () => {
    try {
      const { data: share } = await supabase
        .from('shares')
        .select('object_id')
        .eq('token', token)
        .eq('access_type', 'public')
        .eq('object_type', 'form')
        .maybeSingle();

      if (!share) return;

      const { data: formData } = await supabase
        .from('forms')
        .select('*')
        .eq('id', share.object_id)
        .single();

      setForm(formData as unknown as Form);
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const captureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {}
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      toast({
        variant: 'destructive',
        description: 'Location is required',
      });
      return;
    }

    try {
      setSubmitting(true);

      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
        properties: formData,
      };

      const { error } = await supabase.from('form_responses').insert({
        form_id: form!.id,
        geojson,
        user_id: null,
      });

      if (error) throw error;

      setSubmitted(true);
      setFormData({});
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: 'Failed to submit form',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Form not available</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
          <p className="text-muted-foreground">Your response has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto py-6">
        <h1 className="text-xl font-bold mb-4">{form.title}</h1>

        {location && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.schema?.fields?.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, [field.name]: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, [field.name]: e.target.value })
                  }
                  className="mt-1"
                />
              )}
            </div>
          ))}

          <Button type="submit" disabled={submitting || !location} className="w-full">
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </div>
    </div>
  );
}
