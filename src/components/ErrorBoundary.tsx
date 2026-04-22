import { Component, type ReactNode } from "react";
import Button from "./ui/Button";

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("UI crash captured by ErrorBoundary", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-1))] px-6">
          <div className="w-full max-w-lg rounded-3xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-1))] p-8 text-center">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-[rgb(var(--text-2))]">
              We hit an unexpected issue. Your data is safe.
            </p>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              Reload app
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
