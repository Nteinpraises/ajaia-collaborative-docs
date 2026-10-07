import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Comment = { id: string; author_id: string; author_name: string; body: string; created_at: string };

export function CommentThread({ documentId, userId }: { documentId: string; userId: string | null }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const key = ["comments", documentId];
  const comments = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("document_comments")
        .select("id, author_id, author_name, body, created_at")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });

  async function post() {
    const text = body.trim();
    if (!text || !userId) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const name = (u.user?.user_metadata?.["full_name"] as string) || u.user?.email || "";
    const { error } = await (supabase as any)
      .from("document_comments")
      .insert({ document_id: documentId, author_id: userId, author_name: name, body: text.slice(0, 2000) });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
    qc.invalidateQueries({ queryKey: key });
  }

  async function remove(id: string) {
    const { error } = await (supabase as any).from("document_comments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="h-4 w-4" /> Comments
      </h2>
      {comments.isError && <p className="text-sm text-destructive">Could not load comments.</p>}
      {comments.data?.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
      <ul className="space-y-3">
        {comments.data?.map((c) => (
          <li key={c.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{c.author_name || "Collaborator"}</span>
              <span className="flex items-center gap-2">
                {new Date(c.created_at).toLocaleString()}
                {c.author_id === userId && (
                  <button aria-label="Delete comment" onClick={() => remove(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Leave a note…" maxLength={2000} aria-label="New comment" />
        <Button size="sm" onClick={post} disabled={busy || !body.trim()}>Post comment</Button>
      </div>
    </section>
  );
}
