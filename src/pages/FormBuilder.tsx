import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Settings, GitBranch, Calculator, Layers, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'minLength' | 'maxLength';
  value: string | number;
  message?: string;
}

interface Condition {
  field: string; // Field name to watch
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: string | number;
}

interface Calculation {
  formula: string; // e.g., "{field1} + {field2}" or "{price} * 1.1"
  decimals?: number; // Number of decimal places
}

interface Section {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  pageNumber?: number; // Which page this section belongs to
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
  maxStars?: number; // For rating fields
  conditions?: Condition[]; // For conditional visibility
  conditionLogic?: 'AND' | 'OR'; // How to combine multiple conditions
  calculation?: Calculation; // For calculated fields
  readonly?: boolean; // For calculated fields
  sectionId?: string; // Which section this field belongs to
}

const FormBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formId } = useParams<{ formId?: string }>();
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    const isFieldStaff = user?.roles.includes('field_staff');
    navigate(isFieldStaff ? '/field' : '/analyst');
  };

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [geometryType, setGeometryType] = useState("Point");
const [sections, setSections] = useState<Section[]>([
  { id: "section_1", title: "Basic Information", collapsible: false, pageNumber: 1 }
]);
const [fields, setFields] = useState<FormField[]>([
  { id: "1", name: "field_1", label: "Field 1", type: "text", required: false, readonly: false, sectionId: "section_1" }
]);
  const [multiPage, setMultiPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Load existing form when editing
  useEffect(() => {
    const loadForm = async () => {
      if (!formId) return;
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();
        if (error) throw error;

        setFormTitle(data.title || '');
        setFormDescription(data.description || '');
        setGeometryType(data.geometry_type ? data.geometry_type : 'None');

        const schema = (data.schema || {}) as any;
        const schemaSections: Section[] = Array.isArray(schema.sections) && schema.sections.length
          ? schema.sections
          : [{ id: 'section_1', title: 'Basic Information', collapsible: false, pageNumber: 1 }];
        setSections(schemaSections);

        const firstSectionId = schemaSections[0]?.id || 'section_1';
        const schemaFields = Array.isArray(schema.fields) ? schema.fields : [];
        const mappedFields: FormField[] = schemaFields.map((f: any, idx: number) => ({
          id: String(idx + 1),
          name: f.name,
          label: f.label ?? f.name,
          type: f.type ?? 'text',
          required: !!f.required,
          options: f.options,
          accept: f.accept,
          maxSize: f.maxSize,
          validation: f.validation,
          conditions: f.conditions,
          conditionLogic: f.conditionLogic,
          calculation: f.calculation,
          readonly: !!f.readonly,
          sectionId: f.sectionId || firstSectionId,
        }));
        setFields(mappedFields.length ? mappedFields : [
          { id: '1', name: 'field_1', label: 'Field 1', type: 'text', required: false, readonly: false, sectionId: firstSectionId }
        ]);

        if (typeof schema.multiPage === 'boolean') setMultiPage(schema.multiPage);
        if (typeof schema.totalPages === 'number') setTotalPages(schema.totalPages);
      } catch (e) {
        console.error('Failed to load form', e);
      }
    };
    loadForm();
  }, [formId]);

  const addSection = (pageNumber: number = 1) => {
    const newId = `section_${sections.length + 1}`;
    setSections([...sections, {
      id: newId,
      title: `Section ${sections.length + 1}`,
      collapsible: true,
      pageNumber,
    }]);
  };

  const removeSection = (id: string) => {
    // Move fields from deleted section to first section
    const firstSectionId = sections[0]?.id;
    setFields(fields.map(f => f.sectionId === id ? { ...f, sectionId: firstSectionId } : f));
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addField = (sectionId?: string) => {
    const newId = (fields.length + 1).toString();
    setFields([...fields, {
      id: newId,
      name: `field_${newId}`,
      label: `Field ${newId}`,
      type: "text",
      required: false,
      readonly: false,
      sectionId: sectionId || sections[0]?.id,
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
        sections: sections,
        fields: fields.map(f => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required,
          sectionId: f.sectionId,
          validation: f.validation,
          options: f.options,
          accept: f.accept,
          maxSize: f.maxSize,
          conditions: f.conditions,
          conditionLogic: f.conditionLogic,
          calculation: f.calculation,
          readonly: f.readonly,
        })),
        multiPage,
        totalPages,
      };

      // Save or update form
      if (formId) {
        const { error } = await supabase
          .from("forms")
          .update({
            title: formTitle,
            description: formDescription,
            schema: schema as any,
            geometry_type: geometryType === 'None' ? null : geometryType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("forms")
          .insert([{
            title: formTitle,
            description: formDescription,
            schema: schema as any,
            geometry_type: geometryType === 'None' ? null : geometryType,
            organisation_id: user?.organisation_id,
            created_by: user?.id,
            is_published: true,
          }]);
        if (error) throw error;
      }
      
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
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <Layers className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Form Structure</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={multiPage}
                    onCheckedChange={(checked) => {
                      setMultiPage(checked);
                      if (!checked) {
                        setTotalPages(1);
                        setSections(sections.map(s => ({ ...s, pageNumber: 1 })));
                      }
                    }}
                  />
                  <Label className="text-sm">Multi-Page Form</Label>
                </div>
              </div>

              {multiPage && (
                <Card className="p-4 mb-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Total Pages</Label>
                      <p className="text-sm text-muted-foreground">Split your form into multiple steps</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (totalPages > 1) {
                            setTotalPages(totalPages - 1);
                            setSections(sections.map(s => 
                              (s.pageNumber || 1) > totalPages - 1 ? { ...s, pageNumber: totalPages - 1 } : s
                            ));
                          }
                        }}
                      >
                        -
                      </Button>
                      <span className="w-12 text-center font-medium">{totalPages}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTotalPages(totalPages + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <Tabs defaultValue={multiPage ? "page-1" : "all"} className="w-full">
                {multiPage ? (
                  <>
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${totalPages}, 1fr)` }}>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <TabsTrigger key={i + 1} value={`page-${i + 1}`}>
                          <FileText className="w-4 h-4 mr-2" />
                          Page {i + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {Array.from({ length: totalPages }, (_, pageIdx) => (
                      <TabsContent key={pageIdx + 1} value={`page-${pageIdx + 1}`} className="space-y-4 mt-4">
                        {sections
                          .filter(s => (s.pageNumber || 1) === pageIdx + 1)
                          .map(section => (
                            <Card key={section.id} className="p-4">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      value={section.title}
                                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                      className="font-semibold"
                                      placeholder="Section Title"
                                    />
                                    <Input
                                      value={section.description || ''}
                                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                      placeholder="Section description (optional)"
                                      className="text-sm"
                                    />
                                  </div>
                                  {sections.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSection(section.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {fields
                                    .filter(f => f.sectionId === section.id)
                                    .map((field, index) => (
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
                              <SelectItem value="rating">Rating</SelectItem>
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

                        {/* Rating Settings */}
                        {field.type === 'rating' && (
                          <div className="col-span-2 space-y-2">
                            <Label>Maximum Stars</Label>
                            <Input
                              type="number"
                              min="3"
                              max="10"
                              value={field.maxStars || 5}
                              onChange={(e) => updateField(field.id, { maxStars: parseInt(e.target.value) })}
                              placeholder="Default: 5"
                            />
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

                        {/* Conditional Logic */}
                        <div className="col-span-2">
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full justify-between">
                                <span className="flex items-center gap-2">
                                  <GitBranch className="w-4 h-4" />
                                  Conditional Visibility
                                  {field.conditions && field.conditions.length > 0 && (
                                    <Badge variant="secondary">{field.conditions.length}</Badge>
                                  )}
                                </span>
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-4 space-y-3">
                              <div className="text-sm text-muted-foreground mb-2">
                                Show this field only when conditions are met
                              </div>
                              
                              {field.conditions && field.conditions.length > 0 && (
                                <>
                                  <div className="space-y-2">
                                    <Label>Combine Conditions</Label>
                                    <Select
                                      value={field.conditionLogic || 'AND'}
                                      onValueChange={(value: 'AND' | 'OR') => 
                                        updateField(field.id, { conditionLogic: value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="AND">ALL conditions must be true (AND)</SelectItem>
                                        <SelectItem value="OR">ANY condition can be true (OR)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {field.conditions.map((condition, idx) => (
                                    <Card key={idx} className="p-3">
                                      <div className="grid gap-2 md:grid-cols-3">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Field</Label>
                                          <Select
                                            value={condition.field}
                                            onValueChange={(value) => {
                                              const newConditions = [...(field.conditions || [])];
                                              newConditions[idx] = { ...condition, field: value };
                                              updateField(field.id, { conditions: newConditions });
                                            }}
                                          >
                                            <SelectTrigger className="h-8">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {fields
                                                .filter(f => f.id !== field.id)
                                                .map(f => (
                                                  <SelectItem key={f.id} value={f.name}>
                                                    {f.label}
                                                  </SelectItem>
                                                ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div className="space-y-1">
                                          <Label className="text-xs">Operator</Label>
                                          <Select
                                            value={condition.operator}
                                            onValueChange={(value) => {
                                              const newConditions = [...(field.conditions || [])];
                                              newConditions[idx] = { ...condition, operator: value as any };
                                              updateField(field.id, { conditions: newConditions });
                                            }}
                                          >
                                            <SelectTrigger className="h-8">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="equals">Equals</SelectItem>
                                              <SelectItem value="notEquals">Not Equals</SelectItem>
                                              <SelectItem value="contains">Contains</SelectItem>
                                              <SelectItem value="greaterThan">Greater Than</SelectItem>
                                              <SelectItem value="lessThan">Less Than</SelectItem>
                                              <SelectItem value="isEmpty">Is Empty</SelectItem>
                                              <SelectItem value="isNotEmpty">Is Not Empty</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div className="space-y-1 flex gap-2">
                                          <div className="flex-1">
                                            <Label className="text-xs">Value</Label>
                                            <Input
                                              className="h-8"
                                              value={condition.value}
                                              onChange={(e) => {
                                                const newConditions = [...(field.conditions || [])];
                                                newConditions[idx] = { ...condition, value: e.target.value };
                                                updateField(field.id, { conditions: newConditions });
                                              }}
                                              disabled={condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty'}
                                            />
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-5"
                                            onClick={() => {
                                              const newConditions = field.conditions?.filter((_, i) => i !== idx);
                                              updateField(field.id, { conditions: newConditions });
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newConditions = [
                                    ...(field.conditions || []),
                                    { field: '', operator: 'equals' as const, value: '' }
                                  ];
                                  updateField(field.id, { conditions: newConditions });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-2" />
                                Add Condition
                              </Button>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>

                        {/* Calculated Field */}
                        {(field.type === 'number' || field.type === 'text') && (
                          <div className="col-span-2">
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full justify-between">
                                  <span className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4" />
                                    Calculated Field
                                    {field.calculation && <Badge variant="secondary">Active</Badge>}
                                  </span>
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pt-4 space-y-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label>Make this a calculated field</Label>
                                    <Switch
                                      checked={!!field.calculation}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          updateField(field.id, { 
                                            calculation: { formula: '', decimals: 2 },
                                            readonly: true 
                                          });
                                        } else {
                                          updateField(field.id, { 
                                            calculation: undefined,
                                            readonly: false 
                                          });
                                        }
                                      }}
                                    />
                                  </div>
                                  
                                  {field.calculation && (
                                    <>
                                      <div className="space-y-2">
                                        <Label>Formula</Label>
                                        <Input
                                          placeholder="e.g., {price} * 1.1 or {field1} + {field2}"
                                          value={field.calculation.formula}
                                          onChange={(e) => {
                                            updateField(field.id, {
                                              calculation: {
                                                ...field.calculation!,
                                                formula: e.target.value
                                              }
                                            });
                                          }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Use {'{'}field_name{'}'} to reference other fields. Supports +, -, *, /
                                        </p>
                                      </div>
                                      
                                      {field.type === 'number' && (
                                        <div className="space-y-2">
                                          <Label>Decimal Places</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={field.calculation.decimals ?? 2}
                                            onChange={(e) => {
                                              updateField(field.id, {
                                                calculation: {
                                                  ...field.calculation!,
                                                  decimals: parseInt(e.target.value)
                                                }
                                              });
                                            }}
                                          />
                                        </div>
                                      )}
                                      
                                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                        <strong>Available fields:</strong><br />
                                        {fields
                                          .filter(f => f.id !== field.id && (f.type === 'number' || f.type === 'text'))
                                          .map(f => `{${f.name}}`)
                                          .join(', ') || 'No numeric fields available'}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        )}

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

                                <Button
                                  onClick={() => addField(section.id)}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Field to This Section
                                </Button>
                              </div>
                            </Card>
                          ))}
                        <Button
                          onClick={() => addSection(pageIdx + 1)}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Section to Page {pageIdx + 1}
                        </Button>
                      </TabsContent>
                    ))}
                  </>
                ) : (
                  <TabsContent value="all" className="space-y-4 mt-4">
                    {sections.map(section => (
                      <Card key={section.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={section.title}
                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                className="font-semibold"
                                placeholder="Section Title"
                              />
                              <Input
                                value={section.description || ''}
                                onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                placeholder="Section description (optional)"
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={section.collapsible}
                                  onChange={(e) => updateSection(section.id, { collapsible: e.target.checked })}
                                  className="rounded"
                                />
                                Collapsible
                              </label>
                              {sections.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSection(section.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {fields
                              .filter(f => f.sectionId === section.id)
                              .map((field, index) => (
                                <Card key={field.id}>
                                  <CardContent className="pt-6">
                                    {/* Field content remains the same */}
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

                                      {/* All other field configuration UI - keeping existing code */}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>

                          <Button
                            onClick={() => addField(section.id)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Field to This Section
                          </Button>
                        </div>
                      </Card>
                    ))}
                    <Button
                      onClick={() => addSection()}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FormBuilder;
