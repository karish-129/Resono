import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateAnnouncement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [department, setDepartment] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiCategory, setAiCategory] = useState("");
  const [aiPriority, setAiPriority] = useState<"high" | "medium" | "low">("medium");

  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      department: string;
      summary: string;
      category: string;
      priority: "high" | "medium" | "low";
    }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data: announcement, error } = await supabase
        .from("announcements")
        .insert({
          user_id: user.id,
          title: data.title,
          content: data.content,
          department: data.department,
          summary: data.summary,
          category: data.category,
          priority: data.priority,
        })
        .select()
        .single();

      if (error) throw error;
      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({
        title: "Announcement Created",
        description: "Your announcement has been successfully published.",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateAIInsights = () => {
    // Mock AI generation - can be replaced with real AI later
    setAiSummary(
      "This announcement outlines important updates that require immediate attention from the specified departments."
    );
    setAiCategory("Policy Updates");
    setAiPriority("medium");
    toast({
      title: "AI Analysis Complete",
      description: "Your announcement has been analyzed and categorized.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiSummary || !aiCategory) {
      toast({
        title: "Missing Information",
        description: "Please generate AI insights before publishing.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      title,
      content,
      department,
      summary: aiSummary,
      category: aiCategory,
      priority: aiPriority,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Announcement</h1>
            <p className="text-muted-foreground">
              Upload a new announcement with AI-powered categorization
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter announcement content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Target Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={generateAIInsights}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Insights
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Publishing..." : "Publish Announcement"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-6 h-fit">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">AI Analysis</h3>
                </div>

                {aiSummary ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Summary</Label>
                      <p className="text-sm mt-1">{aiSummary}</p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Category</Label>
                      <Badge className="mt-1" variant="secondary">
                        {aiCategory}
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <Badge
                        className="mt-1"
                        variant={
                          aiPriority === "high"
                            ? "destructive"
                            : aiPriority === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {aiPriority.charAt(0).toUpperCase() + aiPriority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Generate AI insights to see automatic categorization and summary
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
