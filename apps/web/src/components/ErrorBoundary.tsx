"use client";

/**
 * Global Error Boundary — catches rendering errors and shows a recovery UI.
 * Prevents the entire app from crashing when a component fails.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "@/services/loggingService";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error.message || "Unknown error", info.componentStack || undefined);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: 300, padding: 40, background: "#0f172a", color: "#e2e8f0",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ margin: 0, marginBottom: 8, fontSize: 18 }}>Something went wrong</h2>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20, maxWidth: 400, textAlign: "center" }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <pre style={{ fontSize: 11, color: "#64748b", background: "#1e293b", padding: 12, borderRadius: 8, maxWidth: "100%", overflow: "auto", marginBottom: 20 }}>
            {this.state.error?.message}
          </pre>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => window.location.reload()} style={btnStyle}>
              Refresh Page
            </button>
            <button onClick={() => this.setState({ hasError: false, error: null })} style={{ ...btnStyle, background: "#334155" }}>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const btnStyle: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 6, border: "none",
  background: "#3b82f6", color: "white", fontSize: 14, fontWeight: 600,
  cursor: "pointer",
};
