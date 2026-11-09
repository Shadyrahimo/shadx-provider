import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-base font-extrabold text-white">عذراً، حدث خطأ مؤقت في واجهة العرض</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-left" dir="ltr">
              {this.state.error?.message || 'Unknown render error'}
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                إعادة تحميل الصفحة
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                إعادة تعيين التطبيق ومسح التخزين المحلي
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
