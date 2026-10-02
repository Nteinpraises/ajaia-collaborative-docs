import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMyDocuments, listSharedWithMe } from "@/lib/documents.functions";
import {
  DocumentList,
  DocumentListSkeleton,
  EmptyState,
  SharedDocumentList,
} from "@/components/document-list";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Ajaia Docs" },
      { name: "description", content: "Your documents and documents shared with you." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const mine = useQuery({ queryKey: ["documents", "mine"], queryFn: () => listMyDocuments() });
  const shared = useQuery({
    queryKey: ["documents", "shared"],
    queryFn: () => listSharedWithMe(),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you own and everything shared with you.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          My Documents
        </h2>
        {mine.isPending ? (
          <DocumentListSkeleton />
        ) : mine.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Could not load your documents. {mine.error.message}
            </AlertDescription>
          </Alert>
        ) : mine.data.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Create your first document with the New Document button in the sidebar."
          />
        ) : (
          <DocumentList documents={mine.data} />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Shared With Me
        </h2>
        {shared.isPending ? (
          <DocumentListSkeleton rows={2} />
        ) : shared.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Could not load shared documents. {shared.error.message}
            </AlertDescription>
          </Alert>
        ) : shared.data.length === 0 ? (
          <EmptyState
            title="Nothing shared with you yet"
            description="When a teammate shares a document with you, it will appear here."
          />
        ) : (
          <SharedDocumentList documents={shared.data} />
        )}
      </section>
    </div>
  );
}
