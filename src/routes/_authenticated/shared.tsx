import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listSharedWithMe } from "@/lib/documents.functions";
import { DocumentListSkeleton, EmptyState, SharedDocumentList } from "@/components/document-list";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/_authenticated/shared")({
  head: () => ({
    meta: [
      { title: "Shared With Me — Ajaia Docs" },
      { name: "description", content: "Documents your teammates have shared with you." },
    ],
  }),
  component: SharedPage,
});

function SharedPage() {
  const shared = useQuery({
    queryKey: ["documents", "shared"],
    queryFn: () => listSharedWithMe(),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shared With Me</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Documents other people have given you access to.
        </p>
      </div>
      {shared.isPending ? (
        <DocumentListSkeleton />
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
    </div>
  );
}
