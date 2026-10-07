import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Share2 } from "lucide-react";
import {
  getDocument,
  renameDocument,
  saveDocumentContent,
  shareDocument,
} from "@/lib/documents.functions";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { SummaryPanel } from "@/components/summary-panel";
import { CommentThread } from "@/components/comment-thread";

export const Route = createFileRoute("/_authenticated/documents/$documentId")({
  head: () => ({
    meta: [
      { title: "Editor — Ajaia Docs" },
      { name: "description", content: "Edit your document in Ajaia Docs." },
      { property: "og:title", content: "Editor — Ajaia Docs" },
      { property: "og:description", content: "Edit documents and draft AI summaries in Ajaia Docs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  const isOwner = !!doc.data && userId === (doc.data as { owner_id: string }).owner_id;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose-doc focus:outline-none min-h-80" } },
    onUpdate: ({ editor }) => {
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          await saveDocumentContent({ data: { id: documentId, content: editor.getJSON() } });
          queryClient.invalidateQueries({ queryKey: ["documents"] });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not save");
        }
        setSaveState("saved");
      }, 800);
    },
  });
  useEffect(() => {
    if (!editor || !doc.data) return;
    const c = (doc.data as { content: Record<string, unknown> }).content;
    if (c && (c as { type?: string }).type) editor.commands.setContent(c, { emitUpdate: false });
  }, [editor, doc.data]);
  useEffect(() => {
    editor?.setEditable(isOwner);
  }, [editor, isOwner]);

  async function handleShare() {
    const email = window.prompt("Share with (email of an Ajaia Docs user):");
    if (!email) return;
    try {
      await shareDocument({ data: { id: documentId, email: email.trim() } });
      toast.success(`Shared with ${email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share");
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
          {isOwner && (
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          )}
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

      {!isOwner && <p className="text-xs text-muted-foreground">Shared with you — view only.</p>}
      {isOwner && editor && (
        <SummaryPanel
          key={documentId}
          documentId={documentId}
          getText={() => editor.getText()}
          onInsert={(t) =>
            editor.chain().focus().insertContentAt(0, [
              { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Summary" }] },
              ...t.split(/\n+/).filter(Boolean).map((line) => ({ type: "paragraph", content: [{ type: "text", text: line }] })),
            ]).run()
          }
        />
      )}
      {editor && <Toolbar editor={editor} />}
      <div className="min-h-96 rounded-lg border border-border bg-card px-6 py-5">
        <EditorContent editor={editor} />
      </div>
      <CommentThread documentId={documentId} userId={userId} />
    </div>
  );
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor || !editor.isEditable) return null;
  const btns: [string, () => void, boolean][] = [
    ["B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold")],
    ["I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic")],
    [
      "H1",
      () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      editor.isActive("heading", { level: 1 }),
    ],
    [
      "H2",
      () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      editor.isActive("heading", { level: 2 }),
    ],
    [
      "• List",
      () => editor.chain().focus().toggleBulletList().run(),
      editor.isActive("bulletList"),
    ],
    [
      "1. List",
      () => editor.chain().focus().toggleOrderedList().run(),
      editor.isActive("orderedList"),
    ],
    ["Quote", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote")],
  ];
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
      {btns.map(([l, fn, on]) => (
        <Button key={l} type="button" size="sm" variant={on ? "secondary" : "ghost"} onClick={fn}>
          {l}
        </Button>
      ))}
    </div>
  );
}
