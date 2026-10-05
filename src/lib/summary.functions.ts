import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizeText } from "./summary.server";

export const summarizeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), text: z.string().min(20).max(50000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("documents").select("owner_id").eq("id", data.id).maybeSingle();
    if (!doc || doc.owner_id !== context.userId) throw new Error("Only the owner can summarize this document");
    return { summary: await summarizeText(data.text) };
  });
