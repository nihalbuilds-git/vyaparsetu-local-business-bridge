import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

type Result<T> = { data: T | null; error: PostgrestError | Error | null };

/**
 * Consistent handling for Supabase queries so nothing fails silently.
 *
 * Usage:
 *   const rows = await runQuery(
 *     supabase.from("workers").select("*").eq("user_id", uid),
 *     "Could not load workers",
 *   );
 *   if (!rows) return; // error already toasted + logged
 */
export async function runQuery<T>(
  query: PromiseLike<Result<T>>,
  fallbackMessage = "Something went wrong",
): Promise<T | null> {
  try {
    const { data, error } = await query;
    if (error) {
      console.error(`[db] ${fallbackMessage}:`, error);
      toast({
        title: fallbackMessage,
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
    return data;
  } catch (e) {
    console.error(`[db] ${fallbackMessage}:`, e);
    toast({
      title: fallbackMessage,
      description: e instanceof Error ? e.message : "Unexpected error",
      variant: "destructive",
    });
    return null;
  }
}

/**
 * Same as runQuery but for mutations where a success toast is expected.
 * Returns true when the write succeeded.
 */
export async function runMutation<T>(
  query: PromiseLike<Result<T>>,
  opts: { success?: string; failure?: string } = {},
): Promise<boolean> {
  const { success, failure = "Could not save changes" } = opts;
  try {
    const { error } = await query;
    if (error) {
      console.error(`[db] ${failure}:`, error);
      toast({ title: failure, description: error.message, variant: "destructive" });
      return false;
    }
    if (success) toast({ title: success });
    return true;
  } catch (e) {
    console.error(`[db] ${failure}:`, e);
    toast({
      title: failure,
      description: e instanceof Error ? e.message : "Unexpected error",
      variant: "destructive",
    });
    return false;
  }
}
