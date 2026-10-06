import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, FileInput, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { summarizeDocument } from "@/lib/summary.functions";

export function SummaryPanel({
  documentId,
  getText,
  onInsert,
}: {
  documentId: string;
  getText: () => string;
  onInsert: (summary: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  function changeOpen(next: boolean) {
    if (next && !initialized) {
      setSource(getText());
      setInitialized(true);
    }
    setOpen(next);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Summary copied");
    } catch {
      toast.error("Could not copy summary");
    }
  }

  async function generate() {
    setLoading(true);
    try {
      const res = await summarizeDocument({ data: { id: documentId, text: source } });
      setSummary(res.summary);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate summary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card" aria-label="AI summary">
      <Collapsible open={open} onOpenChange={changeOpen}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <h2 className="text-sm font-semibold">AI summary</h2>
            <span className="text-xs text-muted-foreground" role="status">
              {loading ? "Generating…" : summary.trim() ? "Draft" : ""}
            </span>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={open ? "Collapse summary" : "Expand summary"} title={open ? "Collapse summary" : "Expand summary"}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        {!open && summary.trim() && <p className="line-clamp-2 whitespace-pre-wrap px-4 pb-3 text-sm text-muted-foreground">{summary}</p>}
        <CollapsibleContent>
          <div className="space-y-4 border-t border-border p-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium" htmlFor="sum-out">Summary</label>
              <Textarea id="sum-out" rows={6} value={summary} onChange={(e) => setSummary(e.target.value)} disabled={loading} placeholder="Your summary…" className="min-h-36 resize-y" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={!summary.trim() || loading} onClick={copySummary}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                <Button size="sm" variant="outline" disabled={!summary.trim() || loading} onClick={() => { onInsert(summary); toast.success("Summary added to document"); }}>
                  <Plus className="mr-2 h-4 w-4" /> Insert into document
                </Button>
              </div>
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-medium" htmlFor="sum-src">Text to summarize</label>
                <Button size="sm" variant="ghost" disabled={loading} onClick={() => setSource(getText())}>
                  <FileInput className="mr-2 h-4 w-4" /> Use document text
                </Button>
              </div>
              <Textarea id="sum-src" rows={4} value={source} maxLength={50000} disabled={loading} onChange={(e) => setSource(e.target.value)} />
              <Button size="sm" onClick={generate} disabled={loading || source.trim().length < 20}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {loading ? "Generating…" : summary.trim() ? "Regenerate summary" : "Generate summary"}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
