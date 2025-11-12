/**
 * 错误处理器初始化模块
 * 提供 HMR 支持和页面卸载清理
 */

import { errorHandler } from './error-handler';

// 页面卸载时清理（确保在离开页面前同步持久化）
window.addEventListener('beforeunload', () => {
  // 强制同步错误日志
  try {
    const errors = errorHandler.getRecentErrors(50);
    if (errors.length > 0) {
      localStorage.setItem('app_errors', JSON.stringify(errors));
    }
  } catch (e) {
    console.error('页面卸载时保存错误日志失败:', e);
  }
});

// HMR 支持（Vite）
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.info('[HMR] 清理错误处理器监听器');
    errorHandler.cleanup();
  });
  
  import.meta.hot.accept(() => {
    console.info('[HMR] 错误处理器模块已重新加载');
  });
}

// 开发环境：添加全局访问（便于调试）
if (import.meta.env.MODE === 'development') {
  (window as any).__errorHandler__ = errorHandler;
  console.info('[Dev] 错误处理器已挂载到 window.__errorHandler__');
}

export { errorHandler };
