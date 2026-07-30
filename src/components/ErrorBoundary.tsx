import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { reportError } from "@/lib/error-report";


interface Props {
  children: ReactNode;
  /** Optional label to identify where the crash happened (shown in dev only). */
  scope?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/lifecycle crashes so a single broken component can never
 * white-screen the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportError(error, {
      scope: this.props.scope ?? "app",
      componentStack: info.componentStack ?? undefined,
    });
  }


  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            This section failed to load. Your data is safe — try again, or go back to the dashboard.
          </p>
        </div>
        {import.meta.env.DEV && (
          <pre className="max-w-xl overflow-auto rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={this.reset} variant="default">
            <RotateCcw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")} variant="outline">
            <Home className="mr-2 h-4 w-4" /> Dashboard
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
