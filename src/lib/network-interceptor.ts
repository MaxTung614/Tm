// Network Interceptor - 网络请求拦截器

interface SafeFetchOptions extends RequestInit {
  timeout?: number;
}

export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    
    throw error;
  }
}
