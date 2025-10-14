import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIResponseAnalysis = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-responses", {
        body: { query: userMessage, messages: [...messages, { role: "user", content: userMessage }] },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error: any) {
      console.error("Error analyzing responses:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Failed to analyze form responses",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error analyzing your data. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Response Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask questions about your form data in natural language
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start by asking a question about your form data</p>
                <div className="mt-4 text-xs space-y-1">
                  <p className="font-semibold">Try asking:</p>
                  <p>"Show me all responses from the last 7 days"</p>
                  <p>"How many responses have ratings below 3?"</p>
                  <p>"Summarize the feedback from this week"</p>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your form responses..."
            className="min-h-[80px]"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Ask AI
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
