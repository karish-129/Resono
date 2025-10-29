import { useState, useCallback } from "react";
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
import { Sparkles, Upload, X, FileText, Loader2 } from "lucide-react";
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
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      department: string;
      summary: string;
      category: string;
      priority: "high" | "medium" | "low";
      attachments?: any[];
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
          attachments: data.attachments || [],
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

  const generateAIInsights = async () => {
    if (!title || !content) {
      toast({
        title: "Missing Information",
        description: "Please enter a title and content before generating insights.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-announcement', {
        body: { title, content }
      });

      if (error) throw error;

      setAiSummary(data.summary);
      setAiCategory(data.category);
      setAiPriority(data.priority);
      
      toast({
        title: "AI Analysis Complete",
        description: "Your announcement has been analyzed and categorized.",
      });
    } catch (error: any) {
      console.error("AI analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze announcement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];

    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('announcements')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('announcements')
        .getPublicUrl(fileName);

      return {
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      };
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiSummary || !aiCategory) {
      toast({
        title: "Missing Information",
        description: "Please generate AI insights before publishing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const attachments = await uploadFiles();
      setUploadedFileUrls(attachments.map(a => a.url));

      createMutation.mutate({
        title,
        content,
        department,
        summary: aiSummary,
        category: aiCategory,
        priority: aiPriority,
        attachments,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files.",
        variant: "destructive",
      });
    }
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
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, Images (max 10MB each)
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                        >
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateAIInsights}
                    disabled={isAnalyzing || !title || !content}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI Insights
                      </>
                    )}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending || isAnalyzing}>
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
