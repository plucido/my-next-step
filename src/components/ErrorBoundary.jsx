import { Component } from "react";
import { C, H, F } from "../lib/constants.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught render error:", error, errorInfo);
    // Can be extended to send to Sentry or other error tracking
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            ...F,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: C.bg,
            padding: 32,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: C.accSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              marginBottom: 20,
            }}
          >
            !
          </div>
          <h1
            style={{
              ...H,
              fontSize: 22,
              color: C.t1,
              margin: "0 0 8px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              ...F,
              fontSize: 14,
              color: C.t2,
              lineHeight: 1.6,
              margin: "0 0 24px",
              maxWidth: 320,
            }}
          >
            An unexpected error occurred. Please reload the page to try again.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              ...F,
              padding: "12px 28px",
              borderRadius: 14,
              border: "none",
              background: C.accGrad,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(212,82,42,0.25)",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
