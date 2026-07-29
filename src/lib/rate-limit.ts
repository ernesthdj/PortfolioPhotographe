import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS_PER_HOUR = 5;

// Anti-spam sans Redis/Upstash (contrainte 100% gratuit) — comptage par IP dans
// rate_limit_log. Voir docs/modules/DEVIS.md §6.
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export async function isRateLimited(ip: string): Promise<boolean> {
  const supabase = createAdminClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("rate_limit_log")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", oneHourAgo);

  return (count ?? 0) >= MAX_ATTEMPTS_PER_HOUR;
}

export async function logAttempt(ip: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("rate_limit_log").insert({ ip });
}
