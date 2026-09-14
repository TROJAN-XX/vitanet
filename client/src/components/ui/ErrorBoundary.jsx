import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100dvh',
            padding: 'var(--space-lg)',
            textAlign: 'center',
          }}
        >
          <div className="card card-glass" style={{ maxWidth: '480px', width: '100%' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                marginBottom: 'var(--space-sm)',
                color: 'var(--color-error)',
              }}
            >
              Something went wrong
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
              An unexpected client error occurred. Please try reloading the page.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
              <button onClick={this.handleReload} className="btn btn-primary">
                Reload Application
              </button>
              <a href="/" className="btn btn-secondary">
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
