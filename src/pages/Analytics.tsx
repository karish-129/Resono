import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye, Users, FileText } from "lucide-react";

const stats = [
  {
    title: "Total Announcements",
    value: "148",
    change: "+12% from last month",
    icon: FileText,
    trend: "up",
  },
  {
    title: "Total Views",
    value: "2,847",
    change: "+18% from last month",
    icon: Eye,
    trend: "up",
  },
  {
    title: "Active Users",
    value: "342",
    change: "+8% from last month",
    icon: Users,
    trend: "up",
  },
  {
    title: "Engagement Rate",
    value: "78%",
    change: "+5% from last month",
    icon: TrendingUp,
    trend: "up",
  },
];

const topCategories = [
  { name: "Safety & Compliance", count: 45, percentage: 30 },
  { name: "HR & Benefits", count: 38, percentage: 26 },
  { name: "Policy Updates", count: 32, percentage: 22 },
  { name: "Events", count: 18, percentage: 12 },
  { name: "IT & Systems", count: 15, percentage: 10 },
];

const recentActivity = [
  {
    title: "High engagement on Q1 Town Hall announcement",
    time: "2 hours ago",
    type: "success",
  },
  {
    title: "New safety guidelines published",
    time: "5 hours ago",
    type: "info",
  },
  {
    title: "Benefits enrollment closing soon",
    time: "1 day ago",
    type: "warning",
  },
  {
    title: "Parking permits announcement viewed 500+ times",
    time: "2 days ago",
    type: "success",
  },
];

export default function Analytics() {
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
                {topCategories.map((category) => (
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
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
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
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
