import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin } from 'lucide-react';

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
  schema: {
    fields: FormField[];
  };
}

export default function PublicFormSubmit() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadForm();
    captureLocation();
  }, [token]);

  const loadForm = async () => {
    try {
      setLoading(true);

      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('object_id')
        .eq('token', token)
        .eq('access_type', 'public')
        .eq('object_type', 'form')
        .maybeSingle();

      if (shareError || !share) {
        throw new Error('Invalid or expired share link');
      }

      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', share.object_id)
        .single();

      if (formError) throw formError;

      setForm(formData as unknown as Form);
    } catch (error: any) {
      console.error('Error loading form:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load form',
      });
      navigate('/');
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
        (error) => {
          setLocationError('Unable to get location: ' + error.message);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Location is required for submission',
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

      toast({
        title: 'Success',
        description: 'Form submitted successfully',
      });

      setFormData({});
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit form',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
          <p className="text-muted-foreground">This form is not available.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </div>

          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              {location ? (
                <span>
                  Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </span>
              ) : locationError ? (
                <span className="text-destructive">{locationError}</span>
              ) : (
                <span>Capturing location...</span>
              )}
            </div>
          </div>

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

            <Button
              type="submit"
              disabled={submitting || !location}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
