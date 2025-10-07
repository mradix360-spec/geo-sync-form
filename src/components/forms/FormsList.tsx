import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Plus, MapPin, Calendar, Users, Download, FormInput, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FormAssignmentDialog } from "@/components/FormAssignmentDialog";
import { SharePermissionDialog } from "./SharePermissionDialog";

interface Form {
  id: string;
  title: string;
  description: string;
  geometry_type: string;
  is_published: boolean;
  status: string;
  created_at: string;
  response_count?: number;
}

interface FormsListProps {
  showHeader?: boolean;
  forms?: Form[];
  loading?: boolean;
}

export const FormsList = ({ 
  showHeader = false,
  forms: externalForms,
  loading: externalLoading
}: FormsListProps) => {
  const navigate = useNavigate();
  const { canCreateForms, canAssignForms, isFieldUser } = useRole();
  const [internalForms, setInternalForms] = useState<Form[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [assignFormId, setAssignFormId] = useState<string | null>(null);
  const [assignFormTitle, setAssignFormTitle] = useState<string>("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareFormId, setShareFormId] = useState<string | null>(null);

  // Use external data if provided, otherwise use internal state
  const forms = externalForms ?? internalForms;
  const loading = externalLoading ?? internalLoading;

  useEffect(() => {
    // Only load forms if not provided externally
    if (!externalForms) {
      loadForms();
    }
  }, [externalForms]);

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from("forms")
        .select(`
          *,
          form_responses(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formsWithCount = data?.map(form => ({
        ...form,
        response_count: form.form_responses?.[0]?.count || 0,
      })) || [];

      setInternalForms(formsWithCount);
    } catch (error: any) {
      console.error('Error loading forms:', error);
      toast({
        variant: "destructive",
        title: "Error loading forms",
        description: error.message,
      });
    } finally {
      setInternalLoading(false);
    }
  };

  const handleExportGeoJSON = async (formId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to export data",
        });
        return;
      }

      const response = await fetch(
        `https://shqclgwsgmlnimcggxch.supabase.co/functions/v1/export-geojson?formId=${formId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_${formId}_data.geojson`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "GeoJSON file downloaded",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export GeoJSON data",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FormInput className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first form to start collecting field data
          </p>
          {canCreateForms() && (
            <Button onClick={() => navigate("/form-builder")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Form
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">My Forms</h2>
            <p className="text-muted-foreground mt-1">Create and manage field data collection forms</p>
          </div>
          {canCreateForms() && (
            <Button onClick={() => navigate("/form-builder")} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Form
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Card 
            key={form.id} 
            className="hover:shadow-lg transition-all cursor-pointer" 
            onClick={() => {
              // Field users go directly to submit, others go to map view
              if (isFieldUser()) {
                navigate(`/form/${form.id}/submit`);
              } else {
                navigate(`/form/${form.id}/map`);
              }
            }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{form.title}</CardTitle>
                <Badge variant={form.is_published ? "default" : "secondary"}>
                  {form.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {form.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{form.geometry_type || "No geometry"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FormInput className="w-4 h-4" />
                <span>{form.response_count || 0} responses</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(form.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
            <CardFooter className="gap-2 flex-wrap">
              {/* Primary submit button for field users */}
              {isFieldUser() ? (
                <Button 
                  className="w-full" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/form/${form.id}/submit`);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Submission
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/form/${form.id}/submit`);
                }}>
                  <Plus className="w-3 h-3 mr-1" />
                  Submit
                </Button>
              )}
              {!isFieldUser() && (
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/form/${form.id}/map`);
                }}>
                  <Map className="w-3 h-3 mr-1" />
                  View Map
                </Button>
              )}
              {canAssignForms() && (
                <>
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    setAssignFormId(form.id);
                    setAssignFormTitle(form.title);
                  }}>
                    <Users className="w-3 h-3 mr-1" />
                    Assign
                  </Button>
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    setShareFormId(form.id);
                    setShowShareDialog(true);
                  }}>
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </>
              )}
              {!isFieldUser() && (
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  handleExportGeoJSON(form.id);
                }}>
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {assignFormId && (
        <FormAssignmentDialog
          formId={assignFormId}
          formTitle={assignFormTitle}
          open={!!assignFormId}
          onOpenChange={(open) => {
            if (!open) {
              setAssignFormId(null);
              setAssignFormTitle("");
            }
          }}
          onAssignmentComplete={() => {
            loadForms();
          }}
        />
      )}

      {showShareDialog && shareFormId && (
        <SharePermissionDialog
          formId={shareFormId}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          onSuccess={() => {
            loadForms();
          }}
        />
      )}
    </>
  );
};
