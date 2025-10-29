import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, Tag, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AnnouncementCardProps {
  id: string;
  title: string;
  summary: string;
  category: string;
  priority: "high" | "medium" | "low";
  date: string;
  department: string;
}

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

export default function AnnouncementCard({
  id,
  title,
  summary,
  category,
  priority,
  date,
  department,
}: AnnouncementCardProps) {
  const priorityStyle = priorityConfig[priority];

  return (
    <Link to={`/announcement/${id}`}>
      <Card className="p-5 hover:shadow-elevated transition-all duration-300 cursor-pointer bg-gradient-card border-border group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2">
              {title}
            </h3>
          </div>
          <Badge variant="outline" className={cn("shrink-0", priorityStyle.className)}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {priorityStyle.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{summary}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span className="font-medium text-foreground">{category}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{date}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {department}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
