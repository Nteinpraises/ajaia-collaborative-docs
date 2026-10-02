import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DocumentSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type SharedDocument = DocumentSummary & {
  role: string;
  owner_name: string;
  owner_email: string;
};

export const listMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("id, title, created_at, updated_at")
      .eq("owner_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as DocumentSummary[];
  });

export const listSharedWithMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: shares, error } = await context.supabase
      .from("document_shares")
      .select("role, documents(id, title, created_at, updated_at, owner_id)")
      .eq("shared_with", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = (shares ?? []).filter((s) => s.documents != null);
    const ownerIds = [...new Set(rows.map((s) => (s.documents as { owner_id: string }).owner_id))];

    const { data: owners } = ownerIds.length
      ? await context.supabase.from("profiles").select("id, full_name, email").in("id", ownerIds)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

    const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

    return rows.map((s) => {
      const doc = s.documents as unknown as DocumentSummary & { owner_id: string };
      const owner = ownerById.get(doc.owner_id);
      return {
        id: doc.id,
        title: doc.title,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        role: s.role,
        owner_name: owner?.full_name ?? "",
        owner_email: owner?.email ?? "",
      } satisfies SharedDocument;
    });
  });

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ title: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: doc, error } = await context.supabase
      .from("documents")
      .insert({ owner_id: context.userId, title: data.title })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: doc.id as string };
  });

export const getDocument = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("id, title, content, owner_id, created_at, updated_at")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return doc;
  });

export const renameDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("documents")
      .update({ title: data.title })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("documents")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveDocumentContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), content: z.record(z.string(), z.any()) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("documents").update({ content: data.content }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const shareDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase.from("profiles").select("id").eq("email", data.email.toLowerCase()).maybeSingle();
    if (!profile) throw new Error("No Ajaia Docs user found with that email");
    if (profile.id === context.userId) throw new Error("You already own this document");
    const { error } = await context.supabase.from("document_shares").insert({ document_id: data.id, shared_with: profile.id, role: "viewer" });
    if (error) throw new Error(error.code === "23505" ? "Already shared with this user" : error.message);
    return { ok: true };
  });
