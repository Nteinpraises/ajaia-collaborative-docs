import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — Ajaia Docs" },
      { name: "description", content: "Manage your Ajaia Docs account." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userData.user.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (profile.data) setFullName(profile.data.full_name ?? "");
  }, [profile.data]);

  async function handleSave() {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", userData.user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This is how you appear to people you share documents with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : profile.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Could not load your profile. {profile.error.message}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input id="account-email" value={profile.data.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-name">Full name</Label>
                <Input
                  id="account-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
