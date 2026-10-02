import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { DocumentSummary, SharedDocument } from "@/lib/documents.functions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function DocumentList({ documents }: { documents: DocumentSummary[] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          to="/documents/$documentId"
          params={{ documentId: doc.id }}
          className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
            <p className="text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
            </p>
          </div>
          <Badge variant="secondary">Owner</Badge>
        </Link>
      ))}
    </div>
  );
}

export function SharedDocumentList({ documents }: { documents: SharedDocument[] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          to="/documents/$documentId"
          params={{ documentId: doc.id }}
          className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
            <p className="text-xs text-muted-foreground">
              {doc.owner_name || doc.owner_email || "Unknown owner"} · Updated{" "}
              {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
            </p>
          </div>
          <Badge variant="outline">{doc.role === "editor" ? "Can edit" : "Can view"}</Badge>
        </Link>
      ))}
    </div>
  );
}
