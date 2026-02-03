"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut, signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(false);
  const [userName, setUserName] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyMasked, setApiKeyMasked] = useState<string | null>(null);
  const [loadingApiKey, setLoadingApiKey] = useState(true);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [removingApiKey, setRemovingApiKey] = useState(false);
  const handleSignOut = async () => {
    try {
      // Use NextAuth's signOut function
      await signOut({ 
        callbackUrl: "/",
        redirect: false 
      });
      // Manually redirect to landing page after sign out
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback: redirect to landing page if signOut fails
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  useEffect(() => {
    // Only fetch if we have a session
    if (session === undefined) {
      // Session is still loading
      return;
    }

    if (session === null) {
      // No session, don't try to fetch
      setLoadingOrgs(false);
      
      // Debug: Check if cookies are present
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";").map(c => c.trim());
        const sessionCookies = cookies.filter(c => 
          c.includes("authjs.session-token") || 
          c.includes("next-auth.session-token")
        );
        if (sessionCookies.length > 0) {
          console.warn("Session cookies found but session is null. Cookies:", sessionCookies);
        }
      }
      return;
    }

    // Set initial user name for editing
    if (session.user?.name) {
      setUserName(session.user.name);
    }

    // Fetch user's orgs with credentials
    fetch("/api/orgs", {
      credentials: "include", // Ensure cookies are sent
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          console.error("Failed to fetch orgs:", res.status, errorText);
          
          // If 401, the session isn't being read by the API
          if (res.status === 401) {
            console.warn("Session not found by API route. You may need to sign in again.");
            console.warn("Client session exists but API cannot read it. This may indicate a cookie issue.");
          }
          
          setLoadingOrgs(false);
          return;
        }
        const data = await res.json();
        setOrgs(data);
        setLoadingOrgs(false);
      })
      .catch((error) => {
        console.error("Error fetching orgs:", error);
        setLoadingOrgs(false);
      });

    // Fetch API key status
    fetch("/api/user/api-key", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setApiKeyMasked(data.masked || "Not set");
        }
        setLoadingApiKey(false);
      })
      .catch((error) => {
        console.error("Error fetching API key status:", error);
        setLoadingApiKey(false);
      });
  }, [session]);

  const handleEditOrg = (org: Org) => {
    setEditingOrg(org.id);
    setOrgName(org.name);
    setOrgSlug(org.slug);
  };

  const handleSaveOrg = async (orgId: string) => {
    if (!orgName.trim() || !orgSlug.trim()) return;
    
    // Validate slug
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      alert("Slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: orgName.trim(),
          slug: orgSlug.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrgs(orgs.map((o) => (o.id === orgId ? updated : o)));
        setEditingOrg(null);
        router.refresh();
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to update organization" }));
        console.error("Error updating org:", error);
        alert(error.error || "Failed to update organisation");
      }
    } catch (error) {
      console.error("Error updating org:", error);
      alert("Failed to update organisation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingOrg(null);
    setOrgName("");
    setOrgSlug("");
  };

  const handleEditUser = () => {
    setEditingUser(true);
    setUserName(session?.user?.name || "");
  };

  const handleSaveUser = async () => {
    if (!userName.trim() || !session?.user?.id) return;
    
    setSavingUser(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        // Update the session to reflect the new name
        await updateSession();
        setEditingUser(false);
        router.refresh();
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to update user" }));
        console.error("Error updating user:", error);
        alert(error.error || "Failed to update user details");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user details");
    } finally {
      setSavingUser(false);
    }
  };

  const handleCancelEditUser = () => {
    setEditingUser(false);
    setUserName(session?.user?.name || "");
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    
    setSavingApiKey(true);
    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setApiKeyMasked(data.masked);
        setApiKey("");
        alert("API key saved successfully");
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to save API key" }));
        alert(error.error || "Failed to save API key. Make sure it starts with 'sk-'");
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      alert("Failed to save API key. Please try again.");
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!confirm("Are you sure you want to remove your API key?")) return;
    
    setRemovingApiKey(true);
    try {
      const res = await fetch("/api/user/api-key", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setApiKeyMasked("Not set");
        setApiKey("");
        alert("API key removed successfully");
      } else {
        const error = await res.json().catch(() => ({ error: "Failed to remove API key" }));
        alert(error.error || "Failed to remove API key");
      }
    } catch (error) {
      console.error("Error removing API key:", error);
      alert("Failed to remove API key. Please try again.");
    } finally {
      setRemovingApiKey(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session === undefined ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading session...</p>
            </div>
          ) : session === null ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-destructive">No session found</p>
                  <p className="text-xs text-muted-foreground">
                    Your session may have expired or you need to sign in again.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => {
                    // Clear cookies first
                    if (typeof document !== "undefined") {
                      document.cookie.split(";").forEach((c) => {
                        const name = c.split("=")[0].trim();
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
                      });
                    }
                    // Sign in with Google
                    signIn("google", { callbackUrl: "/app/settings" });
                  }} 
                  variant="default" 
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Sign in with Google
                </Button>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => router.push("/login?switch=true")} 
                    variant="outline" 
                    size="sm"
                  >
                    Go to login page
                  </Button>
                  <Button 
                    onClick={async () => {
                      // Try to refresh the session first
                      try {
                        await updateSession();
                        // If that doesn't work, reload the page
                        setTimeout(() => {
                          if (!session) {
                            window.location.reload();
                          }
                        }, 500);
                      } catch {
                        window.location.reload();
                      }
                    }} 
                    variant="ghost" 
                    size="sm"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh session
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">
                  {session.user?.email || "Not available"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Email is managed by your Google account and cannot be changed here.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                {editingUser ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="flex-1"
                      placeholder="Your name"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveUser}
                      disabled={savingUser || !userName.trim()}
                    >
                      {savingUser ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditUser}
                      disabled={savingUser}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {session.user?.name || "Not set"}
                    </p>
                    <Button size="sm" variant="outline" onClick={handleEditUser}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API key</CardTitle>
          <CardDescription>
            Your OpenAI API key is encrypted and stored securely. It will be used for AI-powered features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session === undefined || loadingApiKey ? (
            <p className="text-sm text-muted-foreground">Loading API key status...</p>
          ) : session === null ? (
            <p className="text-sm text-muted-foreground">Please sign in to manage your API key.</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Current API key</Label>
                <p className="text-sm font-mono text-muted-foreground">
                  {apiKeyMasked || "Not set"}
                </p>
                {apiKeyMasked && apiKeyMasked !== "Not set" && (
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored securely.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">New API key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a new API key to replace the existing one. Get your key from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    OpenAI platform
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveApiKey}
                  disabled={savingApiKey || removingApiKey || !apiKey.trim()}
                >
                  {savingApiKey ? "Saving..." : "Save API key"}
                </Button>
                {apiKeyMasked && apiKeyMasked !== "Not set" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveApiKey}
                    disabled={savingApiKey || removingApiKey}
                  >
                    {removingApiKey ? "Removing..." : "Remove API key"}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organisations</CardTitle>
          <CardDescription>Manage your organisations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session === undefined || loadingOrgs ? (
            <p className="text-sm text-muted-foreground">Loading organisations...</p>
          ) : session === null ? (
            <p className="text-sm text-muted-foreground">Please sign in to view organisations.</p>
          ) : orgs.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No organisations found.</p>
              <p className="text-xs text-muted-foreground">
                You need to create an organisation to get started. Complete the onboarding flow to set up your organisation.
              </p>
              <Button 
                onClick={() => router.push("/onboarding")}
                variant="default"
                size="sm"
              >
                Create organisation
              </Button>
            </div>
          ) : (
            orgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                {editingOrg === org.id ? (
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="flex-1"
                        placeholder="Organisation name"
                        maxLength={100}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        className="flex-1"
                        placeholder="organisation-slug"
                        maxLength={50}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveOrg(org.id)}
                        disabled={saving || !orgName.trim() || !orgSlug.trim()}
                      >
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">Slug: {org.slug}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEditOrg(org)}>
                      Edit
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSignOut} variant="outline">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
