import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FileUp, Loader2, Trash2, FileIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/uploads")({
  head: () => ({
    meta: [
      { title: "Upload File — Ajaia Docs" },
      { name: "description", content: "Import files into your Ajaia Docs workspace." },
      { property: "og:title", content: "Upload File — Ajaia Docs" },
      { property: "og:description", content: "Import files into your Ajaia Docs workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UploadsPage,
});

const BUCKET = "document-uploads";

function UploadsPage() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const files = useQuery({
    queryKey: ["uploads"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      setUserId(userData.user.id);
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(userData.user.id, { sortBy: { column: "created_at", order: "desc" } });
      if (error) throw new Error(error.message);
      return (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
    },
  });

  async function handleUpload(selected: FileList | null) {
    if (!selected?.length || !userId) return;
    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        const path = `${userId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file);
        if (error) throw new Error(error.message);
      }
      toast.success(selected.length === 1 ? "File uploaded" : `${selected.length} files uploaded`);
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDelete(name: string) {
    if (!userId) return;
    const { error } = await supabase.storage.from(BUCKET).remove([`${userId}/${name}`]);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("File deleted");
    queryClient.invalidateQueries({ queryKey: ["uploads"] });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload File</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import files into your workspace. Files are stored privately and only you can access them.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          Choose files to upload (up to 50 MB each)
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Imported files will be attachable to documents in a later phase.
        </p>
        <Button className="mt-5" disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            "Select files"
          )}
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your uploads
        </h2>
        {files.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : files.isError ? (
          <Alert variant="destructive">
            <AlertDescription>Could not load uploads. {files.error.message}</AlertDescription>
          </Alert>
        ) : files.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {files.data.map((file) => (
              <div key={file.name} className="flex items-center gap-4 px-5 py-3">
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {file.name.replace(/^\d+-/, "")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${file.name}`}
                  onClick={() => handleDelete(file.name)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
