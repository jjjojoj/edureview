import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { TRPCReactProvider } from "~/trpc/react";
import { Loader2, GraduationCap, AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ReactNode, type ErrorInfo } from "react";

// ─── Error Boundary ───────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
          <div className="card p-10 max-w-lg w-full text-center animate-fade-in">
            <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">页面出了点问题</h2>
            <p className="text-gray-600 mb-2">
              很抱歉，页面遇到了一个意外错误。
            </p>
            {this.state.error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-6 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary group"
              >
                <RotateCcw className="w-4 h-4 mr-2 group-hover:-rotate-180 transition-transform duration-500" />
                返回首页
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Root Route ───────────────────────────────────────────────────
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow float-medium">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gradient-primary">EduAnalytics</h2>
          </div>
          <p className="text-gray-600 text-lg">Preparing your learning experience...</p>
          <div className="mt-6 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TRPCReactProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Outlet />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  borderLeft: '4px solid #10b981',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  borderLeft: '4px solid #ef4444',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#fff',
                },
                style: {
                  borderLeft: '4px solid #3b82f6',
                },
              },
            }}
          />
        </div>
      </ErrorBoundary>
    </TRPCReactProvider>
  );
}
