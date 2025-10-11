import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface AnomalyFlag {
  type: string;
  field: string;
  description: string;
  confidence: number;
}

interface AnomalyReport {
  isAnomaly: boolean;
  severity: "low" | "medium" | "high";
  flags: AnomalyFlag[];
  recommendation: string;
}

interface AnomalyDetectorProps {
  formId: string;
  responseId: string;
  responseData: any;
  autoDetect?: boolean;
}

export const AnomalyDetector = ({ 
  formId, 
  responseId, 
  responseData,
  autoDetect = false 
}: AnomalyDetectorProps) => {
  const [report, setReport] = useState<AnomalyReport | null>(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (autoDetect && responseData) {
      detectAnomalies();
    }
  }, [autoDetect, responseData]);

  const detectAnomalies = async () => {
    setDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-anomalies", {
        body: { formId, responseId, responseData },
      });

      if (error) throw error;
      setReport(data);
    } catch (error) {
      console.error("Anomaly detection error:", error);
    } finally {
      setDetecting(false);
    }
  };

  if (detecting) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Checking for anomalies...</span>
        </div>
      </Card>
    );
  }

  if (!report) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "warning";
      default: return "secondary";
    }
  };

  const getIcon = () => {
    if (!report.isAnomaly) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (report.severity === "high") return <AlertTriangle className="h-5 w-5 text-destructive" />;
    return <Info className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="font-semibold">
            {report.isAnomaly ? "Anomalies Detected" : "No Anomalies"}
          </h3>
        </div>
        {report.isAnomaly && (
          <Badge variant={getSeverityColor(report.severity)}>
            {report.severity.toUpperCase()}
          </Badge>
        )}
      </div>

      {report.isAnomaly && (
        <>
          <Alert>
            <AlertDescription>{report.recommendation}</AlertDescription>
          </Alert>

          {report.flags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Issues Found:</p>
              {report.flags.map((flag, idx) => (
                <div key={idx} className="p-2 bg-secondary/50 rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {flag.type.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(flag.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{flag.field}:</span> {flag.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
};
