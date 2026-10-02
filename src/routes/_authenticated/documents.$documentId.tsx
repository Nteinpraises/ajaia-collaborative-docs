import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Share2 } from "lucide-react";
import { getDocument, renameDocument } from "@/lib/documents.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents/$documentId")({
  head: () => ({
    meta: [
      { title: "Editor — Ajaia Docs" },
      { name: "description", content: "Edit your document in Ajaia Docs." },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  const { documentId } = Route.useParams();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");

  const doc = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument({ data: { id: documentId } }),
  });

  useEffect(() => {
    if (doc.data) setTitle(doc.data.title);
  }, [doc.data]);

  async function handleTitleBlur() {
    const trimmed = title.trim();
    if (!doc.data || !trimmed || trimmed === doc.data.title) return;
    setSaveState("saving");
    try {
      await renameDocument({ data: { id: documentId, title: trimmed } });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setSaveState("saved");
    } catch (e) {
      setSaveState("saved");
      toast.error(e instanceof Error ? e.message : "Could not save title");
    }
  }

  if (doc.isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (doc.isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            This document could not be loaded. It may not exist or you may not have access.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link to="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to documents
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" /> Documents
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveState === "saving" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" /> Saved
              </>
            )}
          </span>
          <Button variant="outline" size="sm" disabled title="Sharing arrives in a later phase">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="h-12 border-transparent bg-transparent px-0 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
        placeholder="Untitled document"
        aria-label="Document title"
      />

      <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-20 text-center">
        <p className="text-sm font-medium text-foreground">The rich-text editor arrives next</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This page is wired to your document in Supabase. The Tiptap editing surface will be
          added in the next phase.
        </p>
      </div>
    </div>
  );
}
