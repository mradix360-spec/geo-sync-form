import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Save, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { offlineStorage } from "@/lib/offlineStorage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'minLength' | 'maxLength';
  value: string | number;
  message?: string;
}

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: string[];
  accept?: string;
  maxSize?: number;
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
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  const handleBack = () => {
    const isFieldStaff = user?.roles.includes('field_staff');
    navigate(isFieldStaff ? '/field' : '/analyst');
  };

  useEffect(() => {
    if (!formId) {
      handleBack();
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

  const validateField = (field: FormField, value: any): string | null => {
    if (!field.validation || field.validation.length === 0) return null;

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'min':
          if (parseFloat(value) < parseFloat(rule.value.toString())) {
            return rule.message || `Minimum value is ${rule.value}`;
          }
          break;
        case 'max':
          if (parseFloat(value) > parseFloat(rule.value.toString())) {
            return rule.message || `Maximum value is ${rule.value}`;
          }
          break;
        case 'minLength':
          if (value.length < parseInt(rule.value.toString())) {
            return rule.message || `Minimum length is ${rule.value} characters`;
          }
          break;
        case 'maxLength':
          if (value.length > parseInt(rule.value.toString())) {
            return rule.message || `Maximum length is ${rule.value} characters`;
          }
          break;
        case 'pattern':
          const regex = new RegExp(rule.value.toString());
          if (!regex.test(value)) {
            return rule.message || 'Invalid format';
          }
          break;
      }
    }
    return null;
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    if (!user?.id) return;

    setUploadingFiles(prev => ({ ...prev, [fieldName]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${formId}/${fieldName}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('form-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('form-attachments')
        .getPublicUrl(fileName);

      setUploadedFiles(prev => ({ ...prev, [fieldName]: file }));
      setFileUrls(prev => ({ ...prev, [fieldName]: fileName }));
      
      toast({
        title: "File uploaded",
        description: file.name,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const removeFile = async (fieldName: string) => {
    const filePath = fileUrls[fieldName];
    if (filePath) {
      await supabase.storage.from('form-attachments').remove([filePath]);
    }
    
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
    
    setFileUrls(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !location) return;

    // Validate all fields
    const errors: Record<string, string> = {};
    form.schema.fields.forEach(field => {
      const value = formData[field.name];
      if (value) {
        const error = validateField(field, value);
        if (error) {
          errors[field.name] = error;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        variant: "destructive",
        title: "Validation errors",
        description: "Please fix the errors before submitting",
      });
      return;
    }

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
          ...fileUrls, // Include file paths
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

      handleBack();
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
          <Button variant="ghost" onClick={handleBack}>
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
                      onChange={(e) => {
                        setFormData({ ...formData, [field.name]: e.target.value });
                        const error = validateField(field, e.target.value);
                        if (error) {
                          setValidationErrors(prev => ({ ...prev, [field.name]: error }));
                        } else {
                          setValidationErrors(prev => {
                            const updated = { ...prev };
                            delete updated[field.name];
                            return updated;
                          });
                        }
                      }}
                      minLength={field.validation?.find(v => v.type === 'minLength')?.value as number}
                      maxLength={field.validation?.find(v => v.type === 'maxLength')?.value as number}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={formData[field.name] || ''}
                      onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'file' ? (
                    <div className="space-y-2">
                      {uploadedFiles[field.name] ? (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <span className="text-sm flex-1 truncate">
                            {uploadedFiles[field.name].name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(field.name)}
                            disabled={uploadingFiles[field.name]}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id={field.name}
                            type="file"
                            accept={field.accept || '*'}
                            required={field.required}
                            disabled={uploadingFiles[field.name]}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const maxSize = (field.maxSize || 5) * 1024 * 1024;
                                if (file.size > maxSize) {
                                  toast({
                                    variant: "destructive",
                                    title: "File too large",
                                    description: `Maximum size is ${field.maxSize || 5}MB`,
                                  });
                                  return;
                                }
                                handleFileUpload(field.name, file);
                              }
                            }}
                            className="hidden"
                          />
                          <Label
                            htmlFor={field.name}
                            className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent"
                          >
                            <Upload className="w-4 h-4" />
                            {uploadingFiles[field.name] ? 'Uploading...' : 'Choose File'}
                          </Label>
                          {field.accept && (
                            <span className="text-xs text-muted-foreground">
                              {field.accept === 'image/*' ? 'Images only' : field.accept}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, [field.name]: e.target.value });
                        const error = validateField(field, e.target.value);
                        if (error) {
                          setValidationErrors(prev => ({ ...prev, [field.name]: error }));
                        } else {
                          setValidationErrors(prev => {
                            const updated = { ...prev };
                            delete updated[field.name];
                            return updated;
                          });
                        }
                      }}
                      min={field.validation?.find(v => v.type === 'min')?.value}
                      max={field.validation?.find(v => v.type === 'max')?.value}
                      minLength={field.validation?.find(v => v.type === 'minLength')?.value as number}
                      maxLength={field.validation?.find(v => v.type === 'maxLength')?.value as number}
                      pattern={field.validation?.find(v => v.type === 'pattern')?.value as string}
                    />
                  )}
                  
                  {validationErrors[field.name] && (
                    <p className="text-sm text-destructive">{validationErrors[field.name]}</p>
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
