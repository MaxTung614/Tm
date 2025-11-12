/**
 * React错误边界组件
 * 捕获和处理React组件渲染错误
 */

import React from 'react';
import { errorHandler, ErrorInfo, ErrorCategory, ErrorLevel } from '../lib/error-handler';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void;
  level?: ErrorLevel;
  category?: ErrorCategory;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorId: string;
  retry: () => void;
  errorInfo?: React.ErrorInfo;
}

/**
 * 默认错误回退组件
 */
const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, errorId, retry, errorInfo }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium text-gray-900">组件加载失败</h3>
          <p className="mt-2 text-sm text-gray-500">
            抱歉，这个组件遇到了问题。请尝试刷新页面或联系技术支持。
          </p>
          <div className="mt-4 text-xs text-gray-400">
            错误ID: {errorId}
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-3">
          <button
            onClick={retry}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            重试
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            刷新页面
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {showDetails ? '隐藏' : '显示'}错误详情
          </button>
          
          {showDetails && (
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
              <div className="font-medium text-red-600">{error.message}</div>
              {error.stack && (
                <pre className="mt-2 whitespace-pre-wrap text-gray-600">
                  {error.stack}
                </pre>
              )}
              {errorInfo?.componentStack && (
                <div className="mt-2">
                  <div className="font-medium">组件堆栈:</div>
                  <pre className="mt-1 whitespace-pre-wrap text-gray-600">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 错误边界组件
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    const errorId = errorHandler.handleReactError(error, errorInfo, errorInfo.componentStack).id;
    
    // 更新状态
    this.setState({
      errorInfo,
      errorId,
    });

    // 调用自定义错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    // 可以在这里发送错误报告到服务器
    this.reportError(error, errorInfo, errorId);
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  /**
   * 报告错误到服务器
   */
  private async reportError(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    try {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        errorBoundary: true,
      };

      // 发送到服务器错误报告端点
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      console.error('Failed to report error to server:', reportingError);
    }
  }

  /**
   * 获取用户ID
   */
  private getUserId(): string | undefined {
    try {
      const authContext = localStorage.getItem('auth_context');
      if (authContext) {
        const context = JSON.parse(authContext);
        return context.user?.id;
      }
    } catch (e) {
      // 忽略解析错误
    }
    return undefined;
  }

  /**
   * 重试机制
   */
  private handleRetry = () => {
    // 清除错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // 可以添加重试延迟
    this.retryTimer = setTimeout(() => {
      // 触发重试逻辑
    }, 1000);
  };

  render() {
    if (this.state.hasError) {
      const { 
        error, 
        errorId, 
        errorInfo 
      } = this.state;

      if (!error || !errorId) {
        return <DefaultErrorFallback 
          error={new Error('未知错误')} 
          errorId="unknown"
          retry={this.handleRetry}
          errorInfo={errorInfo}
        />;
      }

      // 使用自定义回退组件或默认组件
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={error}
          errorId={errorId}
          retry={this.handleRetry}
          errorInfo={errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 错误边界钩子
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error | string, details?: Record<string, any>) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // 记录错误
    const errorInfo = errorHandler.handleError(
      errorObj,
      ErrorLevel.ERROR,
      ErrorCategory.RENDER,
      { ...details, hook: true }
    );

    // 更新状态
    setError(errorObj);

    return errorInfo;
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, captureError, clearError };
};

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * 异步错误边界包装器
 * 用于包装异步操作，防止Promise拒绝导致的错误
 */
export const withAsyncErrorBoundary = <P extends object>(
  asyncOperation: (...args: any[]) => Promise<any>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  return (...args: any[]) => {
    return asyncOperation(...args).catch((error) => {
      errorHandler.handleError(
        error,
        ErrorLevel.ERROR,
        ErrorCategory.UNKNOWN,
        { asyncOperation: true }
      );
      throw error;
    });
  };
};

export default ErrorBoundary;