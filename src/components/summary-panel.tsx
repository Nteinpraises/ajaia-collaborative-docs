import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  if (!open)
    return (
      <Button variant="outline" size="sm" onClick={() => { setSource(getText()); setOpen(true); }}>
        <Sparkles className="mr-2 h-4 w-4" /> Summarize with AI
      </Button>
    );

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4" aria-label="AI summary">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">AI summary</h2>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
      </div>
      <label className="block text-xs text-muted-foreground" htmlFor="sum-src">Text to summarize</label>
      <Textarea id="sum-src" rows={5} value={source} onChange={(e) => setSource(e.target.value)} />
      <Button size="sm" onClick={generate} disabled={loading || source.trim().length < 20}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        {loading ? "Generating…" : "Generate summary"}
      </Button>
      {summary && (
        <>
          <label className="block text-xs text-muted-foreground" htmlFor="sum-out">Summary (editable)</label>
          <Textarea id="sum-out" rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onInsert(summary); toast.success("Summary added to document"); }}>
              Insert at top of document
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(summary)}>Copy</Button>
          </div>
        </>
      )}
    </section>
  );
}
