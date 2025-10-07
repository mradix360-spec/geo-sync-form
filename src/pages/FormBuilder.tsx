import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'minLength' | 'maxLength';
  value: string | number;
  message?: string;
}

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: string[]; // For select fields
  accept?: string; // For file fields
  maxSize?: number; // For file fields in MB
}

const FormBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    const isFieldStaff = user?.roles.includes('field_staff');
    navigate(isFieldStaff ? '/field' : '/analyst');
  };

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [geometryType, setGeometryType] = useState("Point");
  const [fields, setFields] = useState<FormField[]>([
    { id: "1", name: "field_1", label: "Field 1", type: "text", required: false }
  ]);

  const addField = () => {
    const newId = (fields.length + 1).toString();
    setFields([...fields, {
      id: newId,
      name: `field_${newId}`,
      label: `Field ${newId}`,
      type: "text",
      required: false,
    }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Form title required",
        description: "Please enter a title for your form",
      });
      return;
    }

    setSaving(true);
    try {
      const schema = {
        fields: fields.map(f => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required,
        })),
      };

      const { data, error } = await supabase
        .from("forms")
        .insert({
          title: formTitle,
          description: formDescription,
          schema,
          geometry_type: geometryType,
          organisation_id: user?.organisation_id,
          created_by: user?.id,
          is_published: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Form created!",
        description: "Your form has been created successfully",
      });

      // Redirect based on user role
      const isFieldStaff = user?.roles.includes('field_staff');
      navigate(isFieldStaff ? '/field' : '/analyst');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating form",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Form"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Form</CardTitle>
            <CardDescription>Design your field data collection form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Form Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Tree Survey"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this form is used for..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="geometry">Geometry Type</Label>
              <Select value={geometryType} onValueChange={setGeometryType}>
                <SelectTrigger id="geometry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Point">Point</SelectItem>
                  <SelectItem value="LineString">Line</SelectItem>
                  <SelectItem value="Polygon">Polygon</SelectItem>
                  <SelectItem value="None">No Geometry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Form Fields</h3>
                <Button onClick={addField} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Field Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="e.g., Species Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Field Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateField(field.id, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="tel">Phone</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                              <SelectItem value="textarea">Text Area</SelectItem>
                              <SelectItem value="file">File Upload</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Select Options */}
                        {field.type === 'select' && (
                          <div className="col-span-2 space-y-2">
                            <Label>Options (comma-separated)</Label>
                            <Input
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateField(field.id, { 
                                options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              })}
                              placeholder="e.g., Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}

                        {/* File Upload Settings */}
                        {field.type === 'file' && (
                          <div className="col-span-2 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Accepted File Types</Label>
                              <Select
                                value={field.accept || 'image/*'}
                                onValueChange={(value) => updateField(field.id, { accept: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="image/*">Images Only</SelectItem>
                                  <SelectItem value=".pdf">PDF Only</SelectItem>
                                  <SelectItem value=".doc,.docx">Documents</SelectItem>
                                  <SelectItem value="*">All Files</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Max File Size (MB)</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={field.maxSize || 5}
                                onChange={(e) => updateField(field.id, { maxSize: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                        )}

                        {/* Validation Rules */}
                        <div className="col-span-2">
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full justify-between">
                                <span className="flex items-center gap-2">
                                  <Settings className="w-4 h-4" />
                                  Validation Rules
                                  {field.validation && field.validation.length > 0 && (
                                    <Badge variant="secondary">{field.validation.length}</Badge>
                                  )}
                                </span>
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-4 space-y-3">
                              {/* Number validations */}
                              {(field.type === 'number') && (
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Minimum Value</Label>
                                    <Input
                                      type="number"
                                      placeholder="No minimum"
                                      value={field.validation?.find(v => v.type === 'min')?.value || ''}
                                      onChange={(e) => {
                                        const newValidation = [...(field.validation || [])].filter(v => v.type !== 'min');
                                        if (e.target.value) {
                                          newValidation.push({ type: 'min', value: parseFloat(e.target.value) });
                                        }
                                        updateField(field.id, { validation: newValidation });
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Maximum Value</Label>
                                    <Input
                                      type="number"
                                      placeholder="No maximum"
                                      value={field.validation?.find(v => v.type === 'max')?.value || ''}
                                      onChange={(e) => {
                                        const newValidation = [...(field.validation || [])].filter(v => v.type !== 'max');
                                        if (e.target.value) {
                                          newValidation.push({ type: 'max', value: parseFloat(e.target.value) });
                                        }
                                        updateField(field.id, { validation: newValidation });
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Text validations */}
                              {(field.type === 'text' || field.type === 'textarea') && (
                                <>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Min Length</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="No minimum"
                                        value={field.validation?.find(v => v.type === 'minLength')?.value || ''}
                                        onChange={(e) => {
                                          const newValidation = [...(field.validation || [])].filter(v => v.type !== 'minLength');
                                          if (e.target.value) {
                                            newValidation.push({ type: 'minLength', value: parseInt(e.target.value) });
                                          }
                                          updateField(field.id, { validation: newValidation });
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Max Length</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="No maximum"
                                        value={field.validation?.find(v => v.type === 'maxLength')?.value || ''}
                                        onChange={(e) => {
                                          const newValidation = [...(field.validation || [])].filter(v => v.type !== 'maxLength');
                                          if (e.target.value) {
                                            newValidation.push({ type: 'maxLength', value: parseInt(e.target.value) });
                                          }
                                          updateField(field.id, { validation: newValidation });
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Pattern (RegEx)</Label>
                                    <Input
                                      placeholder="e.g., ^[A-Z]{3}-\d{4}$"
                                      value={field.validation?.find(v => v.type === 'pattern')?.value || ''}
                                      onChange={(e) => {
                                        const newValidation = [...(field.validation || [])].filter(v => v.type !== 'pattern');
                                        if (e.target.value) {
                                          newValidation.push({ type: 'pattern', value: e.target.value });
                                        }
                                        updateField(field.id, { validation: newValidation });
                                      }}
                                    />
                                  </div>
                                </>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>

                        <div className="flex items-center justify-between col-span-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="rounded"
                            />
                            Required field
                          </label>
                          {fields.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeField(field.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FormBuilder;
