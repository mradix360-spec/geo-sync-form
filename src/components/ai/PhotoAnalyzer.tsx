import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoAnalysis {
  objects: string[];
  issues: string[];
  locationType: string;
  tags: string[];
  riskLevel: "low" | "medium" | "high";
  description: string;
}

interface PhotoAnalyzerProps {
  imageUrl: string;
  onAnalysisComplete?: (analysis: PhotoAnalysis) => void;
}

export const PhotoAnalyzer = ({ imageUrl, onAnalysisComplete }: PhotoAnalyzerProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const { toast } = useToast();

  const analyzePhoto = async () => {
    setAnalyzing(true);
    try {
      // Convert image URL to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const imageBase64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke("analyze-photo", {
        body: { imageBase64 },
      });

      if (error) throw error;

      setAnalysis(data);
      onAnalysisComplete?.(data);

      toast({
        title: "Photo analyzed!",
        description: `Found ${data.objects?.length || 0} objects, ${data.issues?.length || 0} issues`,
      });
    } catch (error: any) {
      console.error("Photo analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (level: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (level) {
      case "high": return "destructive";
      case "medium": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Photo Analysis</h3>
        </div>
        <Button
          onClick={analyzePhoto}
          disabled={analyzing}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{analysis.description}</p>
          </div>

          {analysis.riskLevel && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Risk Level:</span>
              <Badge variant={getRiskColor(analysis.riskLevel)}>
                {analysis.riskLevel.toUpperCase()}
              </Badge>
            </div>
          )}

          {analysis.objects && analysis.objects.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Detected Objects:</p>
              <div className="flex flex-wrap gap-1">
                {analysis.objects.map((obj, idx) => (
                  <Badge key={idx} variant="secondary">
                    {obj}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.issues && analysis.issues.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Issues Found:</p>
              <div className="flex flex-wrap gap-1">
                {analysis.issues.map((issue, idx) => (
                  <Badge key={idx} variant="destructive">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.tags && analysis.tags.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Suggested Tags:</p>
              <div className="flex flex-wrap gap-1">
                {analysis.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.locationType && (
            <div>
              <p className="text-sm">
                <span className="font-medium">Location Type:</span> {analysis.locationType}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
