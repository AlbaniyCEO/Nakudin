import { createRoot } from "react-dom/client";
import { Component, type ReactNode, type ErrorInfo } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Runtime error:", error.message, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "system-ui", maxWidth: 480, margin: "0 auto", paddingTop: 80 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#6b7280", marginBottom: 16, fontSize: 14 }}>The app crashed. Please refresh to try again.</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ background: "#6D28D9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            Refresh
          </button>
          <details style={{ marginTop: 20 }}>
            <summary style={{ cursor: "pointer", color: "#9ca3af", fontSize: 12 }}>Error details</summary>
            <pre style={{ fontSize: 11, color: "#6b7280", marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {this.state.error.message}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
