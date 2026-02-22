import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Eye, EyeOff } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { User as SupabaseUser } from "@supabase/supabase-js";

const Account = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || "");
      setAvatarUrl(data.avatar_url || "");
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), avatar_url: avatarUrl.trim() })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved! ✨" });
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: "Error changing password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated! 🔒" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    // Delete all user data (cascading from conversations → messages)
    const { error: convError } = await supabase
      .from("conversations")
      .delete()
      .eq("user_id", user.id);

    if (convError) {
      toast({ title: "Error deleting data", description: convError.message, variant: "destructive" });
      setDeleting(false);
      return;
    }

    // Delete profile
    await supabase.from("profiles").delete().eq("user_id", user.id);

    // Sign out
    await supabase.auth.signOut();
    toast({ title: "Account data deleted. Goodbye! 👋" });
    navigate("/");
    setDeleting(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={logoImage} alt="MemeMind" className="w-8 h-8" />
          <h1 className="font-display text-2xl text-gradient">Account</h1>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Section */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground">Profile</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={50}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="mt-1"
                />
              </div>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>

            <Button onClick={saveProfile} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </section>

          {/* Password Section */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-xl text-foreground">Change Password</h2>

            <div className="space-y-3">
              <div className="relative">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={changePassword} disabled={saving || !newPassword} className="gap-2">
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </section>

          {/* Delete Account Section */}
          <section className="bg-card border border-destructive/30 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-xl text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">
              This will permanently delete all your conversations and data. This cannot be undone.
            </p>

            {!confirmDelete ? (
              <Button variant="destructive" onClick={() => setConfirmDelete(true)} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="destructive" onClick={deleteAccount} disabled={deleting} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Yes, delete everything"}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Account;
