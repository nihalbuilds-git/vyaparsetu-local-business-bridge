import { supabase } from "@/integrations/supabase/client";

// DPDP Act 2023 — Right to data portability.
// Exports all user-owned data as a single JSON file.
export async function exportAllUserData(userId: string) {
  const tables = [
    "businesses",
    "workers",
    "attendance",
    "worker_advances",
    "khata_entries",
    "invoices",
    "inventory_items",
    "expenses",
    "contacts",
    "campaigns",
    "notifications",
    "user_subscriptions",
    "payments",
    "ai_conversations",
    "ai_messages",
    "profiles",
  ] as const;

  const dump: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    user_id: userId,
  };

  for (const t of tables) {
    const { data, error } = await supabase.from(t as any).select("*");
    dump[t] = error ? { error: error.message } : data;
  }

  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vyaparsetu-data-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
