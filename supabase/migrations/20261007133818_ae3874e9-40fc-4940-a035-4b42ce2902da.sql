CREATE TABLE public.document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.document_comments TO authenticated;
GRANT ALL ON public.document_comments TO service_role;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collaborators read comments" ON public.document_comments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.owner_id = auth.uid()) OR public.is_document_shared_with(auth.uid(), document_id));
CREATE POLICY "Collaborators add comments" ON public.document_comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND length(body) BETWEEN 1 AND 2000 AND (EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND d.owner_id = auth.uid()) OR public.is_document_shared_with(auth.uid(), document_id)));
CREATE POLICY "Authors delete own comments" ON public.document_comments FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE INDEX ON public.document_comments(document_id, created_at);