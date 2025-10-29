import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Tag, TrendingUp, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityConfig = {
  high: {
    label: "High Priority",
    className: "bg-priority-high/10 text-priority-high border-priority-high/20",
  },
  medium: {
    label: "Medium Priority",
    className: "bg-priority-medium/10 text-priority-medium border-priority-medium/20",
  },
  low: {
    label: "Low Priority",
    className: "bg-priority-low/10 text-priority-low border-priority-low/20",
  },
};

export default function AnnouncementDetail() {
  const { id } = useParams();

  const { data: announcement, isLoading } = useQuery({
    queryKey: ["announcement", id],
    queryFn: async () => {
      if (!id) throw new Error("No ID provided");
      
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-background">
        <div className="ml-64 p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Announcement Not Found</h1>
            <Link to="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const priorityStyle = priorityConfig[announcement.priority as keyof typeof priorityConfig];

  return (
    <div className="min-h-screen bg-background">
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card className="p-8 bg-gradient-card">
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-3xl font-bold text-foreground flex-1">
                    {announcement.title}
                  </h1>
                  <Badge variant="outline" className={cn("shrink-0", priorityStyle.className)}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {priorityStyle.label}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium text-foreground">
                      {announcement.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <Badge variant="secondary">{announcement.department}</Badge>
                  </div>
                </div>
              </div>

              {announcement.summary && (
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">AI Summary</h3>
                      <p className="text-sm text-muted-foreground">{announcement.summary}</p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {announcement.content}
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Posted on {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
