import React from 'react';

export default class RSAErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("RSAErrorBoundary caught an error", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: 'var(--bg-glass)', border: '1px solid var(--red)', borderRadius: 12, color: 'var(--red)', marginTop: 20 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>⚠️ Renderer Crash (Lỗi dựng giao diện RSA)</h3>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.message || "Unknown error"}</p>
          <pre style={{ overflowX: 'auto', fontSize: 11, background: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 8, marginTop: 12 }}>
            {this.state.error?.stack}
          </pre>
          <pre style={{ overflowX: 'auto', fontSize: 11, background: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 8, marginTop: 12 }}>
            {this.state.info?.componentStack}
          </pre>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => this.setState({ hasError: false })}>
            Thử tải lại Section
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
