import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, Users, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const totalAnnouncements = announcements?.length || 0;
  const totalViews = announcements?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;
  
  // Calculate categories
  const categoryCount = announcements?.reduce((acc, announcement) => {
    const category = announcement.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const topCategories = Object.entries(categoryCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalAnnouncements > 0 ? Math.round((count / totalAnnouncements) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Recent activity based on recent announcements
  const recentActivity = announcements?.slice(0, 4).map((announcement) => {
    const date = new Date(announcement.created_at);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    let timeStr = "";
    if (diffHours < 1) timeStr = "Just now";
    else if (diffHours < 24) timeStr = `${diffHours} hours ago`;
    else timeStr = `${Math.floor(diffHours / 24)} days ago`;

    return {
      title: `New: ${announcement.title}`,
      time: timeStr,
      type: announcement.priority === "high" ? "warning" : announcement.priority === "medium" ? "info" : "success",
    };
  }) || [];

  const stats = [
    {
      title: "Total Announcements",
      value: totalAnnouncements.toString(),
      change: "+12% from last month",
      icon: FileText,
      trend: "up",
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      change: "+18% from last month",
      icon: Eye,
      trend: "up",
    },
    {
      title: "Active Users",
      value: "---",
      change: "Coming soon",
      icon: Users,
      trend: "up",
    },
    {
      title: "Engagement Rate",
      value: totalAnnouncements > 0 ? `${Math.round((totalViews / totalAnnouncements))}x` : "0x",
      change: "Avg views per announcement",
      icon: TrendingUp,
      trend: "up",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Track announcement performance and user engagement
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-24" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track announcement performance and user engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="p-6 bg-gradient-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </Card>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Top Categories</h2>
              <div className="space-y-4">
                {topCategories.length > 0 ? (
                  topCategories.map((category) => (
                    <div key={category.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{category.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {category.count} announcements
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No categories yet</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          activity.type === "success"
                            ? "bg-success"
                            : activity.type === "warning"
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}