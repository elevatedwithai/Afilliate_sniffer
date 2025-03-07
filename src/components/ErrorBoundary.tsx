import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex justify-center">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
              <div className="mt-6 text-left">
                <details className="bg-gray-50 p-3 rounded border border-gray-200">
                  <summary className="font-medium cursor-pointer">Error Details</summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 rounded">
                    {this.state.error?.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
