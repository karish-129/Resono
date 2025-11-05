import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

export default function RoleSelection() {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const [selectedRole, setSelectedRole] = useState<'master' | 'admin' | 'user' | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // If user already has a role, redirect to dashboard
    if (role && !roleLoading) {
      navigate("/");
    }
  }, [user, role, roleLoading, navigate]);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      return;
    }

    // If user role selected, insert it into database
    if (selectedRole === 'user') {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('verify-role-password', {
          body: { password: '', requestedRole: 'user' }
        });

        if (error) throw error;

        if (data.success) {
          toast({
            title: "Welcome!",
            description: "You have been registered as a user.",
          });
          navigate("/");
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-role-password', {
        body: { password, requestedRole: selectedRole }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Role Assigned",
          description: `You now have ${selectedRole} privileges.`,
        });
        navigate("/");
      } else {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is incorrect.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Your Role</h1>
          <p className="text-muted-foreground">Choose your access level for Resono</p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            className={`w-full h-20 justify-start ${selectedRole === 'master' ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setSelectedRole('master')}
          >
            <Shield className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Master</div>
              <div className="text-xs text-muted-foreground">Full control - publish, edit, delete all notices</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className={`w-full h-20 justify-start ${selectedRole === 'admin' ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setSelectedRole('admin')}
          >
            <Lock className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Admin</div>
              <div className="text-xs text-muted-foreground">Can publish and edit all notices</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className={`w-full h-20 justify-start ${selectedRole === 'user' ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setSelectedRole('user')}
          >
            <User className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div className="font-semibold">User</div>
              <div className="text-xs text-muted-foreground">View-only access to notices</div>
            </div>
          </Button>
        </div>

        {selectedRole && selectedRole !== 'user' && (
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="password">Enter {selectedRole} PIN</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Enter ${selectedRole === 'master' ? '124124' : '421421'}`}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {selectedRole === 'master' ? 'Master PIN: 124124' : 'Admin PIN: 421421'}
              </p>
            </div>
            <Button
              onClick={handleRoleSelection}
              className="w-full"
              disabled={loading || !password}
            >
              {loading ? "Verifying..." : "Confirm"}
            </Button>
          </div>
        )}

        {selectedRole === 'user' && (
          <div className="mt-6">
            <Button
              onClick={handleRoleSelection}
              className="w-full"
              disabled={loading}
            >
              Continue as User
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}