import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementCard from "@/components/AnnouncementCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  priority: "high" | "medium" | "low";
  created_at: string;
  department: string;
}

const filterOptions = ["All", "High Priority", "Medium Priority", "Low Priority"];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
  });

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.summary?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "High Priority" && announcement.priority === "high") ||
      (activeFilter === "Medium Priority" && announcement.priority === "medium") ||
      (activeFilter === "Low Priority" && announcement.priority === "low");

    return matchesSearch && matchesFilter;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Your personalized feed of prioritized announcements
            </p>
          </div>

          <div className="mb-6 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {filterOptions.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <AnnouncementCard 
                  key={announcement.id} 
                  id={announcement.id}
                  title={announcement.title}
                  summary={announcement.summary || ""}
                  category={announcement.category}
                  priority={announcement.priority}
                  date={new Date(announcement.created_at).toISOString().split('T')[0]}
                  department={announcement.department}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No announcements found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
