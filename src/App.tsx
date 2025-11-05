import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useRole } from "./hooks/useRole";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CreateAnnouncement from "./pages/CreateAnnouncement";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import RoleSelection from "./pages/RoleSelection";
import ProfileSettings from "./pages/ProfileSettings";
import ArchivedAnnouncements from "./pages/ArchivedAnnouncements";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireRole = true }: { children: React.ReactNode; requireRole?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If role is required and user doesn't have one (or only has default 'user' without selection), redirect to role-selection
  if (requireRole && !role) {
    return <Navigate to="/role-selection" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/role-selection"
          element={
            <ProtectedRoute requireRole={false}>
              <RoleSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Sidebar />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <Sidebar />
              <CreateAnnouncement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcement/:id"
          element={
            <ProtectedRoute>
              <Sidebar />
              <AnnouncementDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Sidebar />
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Sidebar />
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/archived"
          element={
            <ProtectedRoute>
              <ArchivedAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
