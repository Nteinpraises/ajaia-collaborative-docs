import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Shield, UploadCloud, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ajaia Docs — A calm workspace for your documents" },
      {
        name: "description",
        content:
          "Ajaia Docs is a lightweight collaborative document workspace. Create, organize, and share documents with your team.",
      },
      { property: "og:title", content: "Ajaia Docs" },
      {
        property: "og:description",
        content: "A lightweight collaborative document workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: FileText,
    title: "Clean document editor",
    description: "A focused writing surface for your team's documents.",
  },
  {
    icon: Users,
    title: "Share with your team",
    description: "Share documents with teammates and control who can view or edit.",
  },
  {
    icon: UploadCloud,
    title: "File imports",
    description: "Bring existing files into your workspace with secure uploads.",
  },
  {
    icon: Shield,
    title: "Private by default",
    description: "Your documents are only visible to you and the people you share with.",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">Ajaia Docs</span>
        </div>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button onClick={() => navigate({ to: "/documents" })}>Go to dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/auth" })}>
                Sign in
              </Button>
              <Button onClick={() => navigate({ to: "/auth" })}>Get started</Button>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-24 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            A calm workspace for your documents
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Create, organize, and share documents with your team — without the noise of a
            heavyweight suite.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/auth" })}>
              Start writing
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Ajaia Docs — a lightweight document workspace.
      </footer>
    </div>
  );
}
