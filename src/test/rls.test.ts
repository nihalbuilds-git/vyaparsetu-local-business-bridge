/**
 * RLS regression tests — guards against cross-tenant data leakage.
 *
 * Runs only when TEST_USER_A_EMAIL / TEST_USER_A_PASSWORD /
 * TEST_USER_B_EMAIL / TEST_USER_B_PASSWORD are set in the environment.
 * Both users must exist in the Cloud auth system.
 *
 *   bunx vitest run src/test/rls.test.ts
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const A_EMAIL = process.env.TEST_USER_A_EMAIL;
const A_PASS = process.env.TEST_USER_A_PASSWORD;
const B_EMAIL = process.env.TEST_USER_B_EMAIL;
const B_PASS = process.env.TEST_USER_B_PASSWORD;

const enabled = Boolean(URL && KEY && A_EMAIL && A_PASS && B_EMAIL && B_PASS);
const d = enabled ? describe : describe.skip;

async function loginAs(email: string, password: string): Promise<{ client: SupabaseClient; uid: string }> {
  const client = createClient(URL!, KEY!, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`Login failed for ${email}: ${error?.message}`);
  return { client, uid: data.user.id };
}

d("RLS: cross-tenant isolation", () => {
  let A: { client: SupabaseClient; uid: string };
  let B: { client: SupabaseClient; uid: string };
  let workerAId: string;

  beforeAll(async () => {
    A = await loginAs(A_EMAIL!, A_PASS!);
    B = await loginAs(B_EMAIL!, B_PASS!);

    const { data } = await A.client
      .from("workers")
      .insert({ user_id: A.uid, name: `rls-probe-${Date.now()}`, daily_salary: 100 })
      .select("id")
      .single();
    workerAId = data!.id;
  });

  it("user B cannot read user A's workers", async () => {
    const { data, error } = await B.client.from("workers").select("id").eq("id", workerAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("user B cannot update user A's workers", async () => {
    const { data, error } = await B.client
      .from("workers")
      .update({ name: "hijacked" })
      .eq("id", workerAId)
      .select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("user B cannot delete user A's workers", async () => {
    const { data, error } = await B.client.from("workers").delete().eq("id", workerAId).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("user B cannot insert a worker owned by user A", async () => {
    const { error } = await B.client
      .from("workers")
      .insert({ user_id: A.uid, name: "spoof", daily_salary: 1 });
    expect(error).not.toBeNull();
  });

  it("worker-avatars bucket rejects listing another user's folder", async () => {
    const { data, error } = await B.client.storage.from("worker-avatars").list(A.uid);
    // Either an error or an empty listing is acceptable (both mean isolated).
    expect(error || (Array.isArray(data) && data.length === 0)).toBeTruthy();
  });

  it("worker-avatars is private — public URL must NOT resolve to a file", async () => {
    // Upload a probe file as A, then confirm the public URL is inaccessible.
    const probePath = `${A.uid}/rls-probe.txt`;
    await A.client.storage.from("worker-avatars").upload(
      probePath,
      new Blob(["probe"], { type: "text/plain" }),
      { upsert: true }
    );
    const { data } = A.client.storage.from("worker-avatars").getPublicUrl(probePath);
    const res = await fetch(data.publicUrl);
    // Private bucket → the CDN must refuse anonymous reads (400 or 403).
    expect(res.ok).toBe(false);
    await A.client.storage.from("worker-avatars").remove([probePath]);
  });

  it("user B cannot read user A's audit_logs", async () => {
    const { data, error } = await B.client
      .from("audit_logs")
      .select("id")
      .eq("user_id", A.uid);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("user B cannot forge an audit_logs row as user A", async () => {
    const { error } = await B.client
      .from("audit_logs")
      .insert({ user_id: A.uid, event_type: "forged" });
    expect(error).not.toBeNull();
  });
});

if (!enabled) {
  describe.skip("RLS regression tests skipped — set TEST_USER_A/B_EMAIL and _PASSWORD to enable", () => {
    it("noop", () => { /* skip */ });
  });
}
