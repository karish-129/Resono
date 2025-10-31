import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
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
import { Sparkles, Upload, X, FileText, Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateAnnouncement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roleLoading && role === 'user') {
      toast({
        title: "Access Denied",
        description: "Only Admins and Masters can publish notices.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [role, roleLoading, navigate, toast]);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [department, setDepartment] = useState("");
  const [deadline, setDeadline] = useState("");
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
      deadline?: string;
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
          deadline: data.deadline || null,
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
    
    if (!aiCategory) {
      toast({
        title: "Missing Information",
        description: "Please enter a category before publishing.",
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
        deadline: deadline || undefined,
        summary: aiSummary || content.substring(0, 150) + "...",
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

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="min-h-screen bg-background">
        <div className="ml-64 p-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
            <p className="text-muted-foreground mb-6">
              Only Admins and Masters can publish notices.
            </p>
            <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

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
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="Set announcement deadline"
                  />
                  <p className="text-xs text-muted-foreground">
                    Announcements will be archived after this date
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Enter category or use AI to generate"
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={aiPriority} onValueChange={(value: "high" | "medium" | "low") => setAiPriority(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
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
                      <Label className="text-xs text-muted-foreground">Current Category</Label>
                      <Badge className="mt-1" variant="secondary">
                        {aiCategory || "Not set"}
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Current Priority</Label>
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
                    <p className="text-xs text-muted-foreground italic">
                      You can edit category and priority in the form
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Generate AI insights for automatic categorization, or manually enter category and priority
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
