import { supabase } from "@/integrations/supabase/client";

export interface ErrorReportContext {
  /** Where the crash happened: component scope, route, or handler name. */
  scope?: string;
  /** React component stack, when available. */
  componentStack?: string;
  /** Extra structured details. */
  metadata?: Record<string, unknown>;
}

function serialize(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack?.slice(0, 4000) };
  }
  return { name: "UnknownError", message: String(error), stack: undefined as string | undefined };
}

const recent = new Map<string, number>();

/**
 * Report a frontend crash/error: always logs to the console, and records an
 * `client.error` audit row for signed-in users so regressions are traceable.
 * Fire-and-forget — never throws, never blocks rendering.
 */
export async function reportError(error: unknown, context: ErrorReportContext = {}) {
  const info = serialize(error);
  console.error(`[error-report]${context.scope ? ` ${context.scope}` : ""}`, info.message, error);

  // De-dupe identical errors within 30s (React can re-throw on re-render).
  const key = `${context.scope ?? ""}|${info.name}|${info.message}`;
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < 30_000) return;
  recent.set(key, now);
  if (recent.size > 200) recent.clear();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      event_type: "client.error",
      resource: context.scope ?? "frontend",
      status: "error",
      metadata: {
        name: info.name,
        message: info.message.slice(0, 1000),
        stack: info.stack,
        component_stack: context.componentStack?.slice(0, 2000),
        route: typeof window !== "undefined" ? window.location.pathname : undefined,
        ...context.metadata,
      },
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    } as never);
  } catch {
    // Reporting must never break the app.
  }
}

let installed = false;

/**
 * Catch errors that escape React: uncaught exceptions and rejected promises.
 * Call once at app startup.
 */
export function installGlobalErrorReporting() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    void reportError(event.error ?? event.message, {
      scope: "window.onerror",
      metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    void reportError(event.reason, { scope: "unhandledrejection" });
  });
}
