import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AnnouncementCard from "@/components/AnnouncementCard";
import Sidebar from "@/components/Sidebar";

export default function ArchivedAnnouncements() {
  const navigate = useNavigate();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["archived-announcements"],
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
        .eq("archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              size="icon"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Archived Notices</h1>
              <p className="text-muted-foreground mt-2">
                Past deadline announcements
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {announcements && announcements.length > 0 ? (
              announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  id={announcement.id}
                  title={announcement.title}
                  summary={announcement.summary || ""}
                  category={announcement.category}
                  priority={announcement.priority as "high" | "medium" | "low"}
                  date={new Date(announcement.created_at).toLocaleDateString()}
                  department={announcement.department}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No archived announcements found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}