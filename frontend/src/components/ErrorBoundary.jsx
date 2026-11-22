import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SentinelAI UI Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0c1324] border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-6">
            <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Application Notice</h2>
              <p className="text-xs text-slate-400 mt-2">
                A rendering component encountered an unexpected error. Your cryptographic session and threat telemetry remain safe.
              </p>
              {this.state.error?.message && (
                <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-red-300 text-left overflow-x-auto max-h-36">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="h-4 w-4" /> Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Home className="h-4 w-4" /> Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
