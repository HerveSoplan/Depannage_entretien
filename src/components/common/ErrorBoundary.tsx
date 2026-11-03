import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '../../version';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erreur interceptée par ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
              <p className="text-xs text-gray-500 mt-0.5">v{APP_VERSION}</p>
            </div>
            <p className="text-sm text-gray-600">
              L'application a rencontré une interruption temporaire d'affichage. Cliquez ci-dessous pour recharger l'interface.
            </p>
            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-left text-xs text-red-700 font-mono overflow-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recharger l'application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
