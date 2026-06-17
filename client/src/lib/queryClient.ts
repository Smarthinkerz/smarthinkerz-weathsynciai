import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    formData?: boolean;
  }
): Promise<Response> {
  // Ensure URL is relative
  const apiUrl = url.startsWith('/') ? url : `/${url}`;

  try {
    console.log(`Making ${method} request to ${apiUrl}`);
    
    // Prepare request options based on content type
    const requestOptions: RequestInit = {
      method,
      credentials: "include",
    };
    
    // Handle FormData vs JSON differently
    if (options?.formData) {
      // If using FormData, don't set Content-Type header (browser will set it with boundary)
      console.log("Sending FormData request");
      // FormData should be passed directly as the body
      requestOptions.body = data as FormData;
    } else {
      // For JSON requests, set headers and stringify the body
      requestOptions.headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };
      requestOptions.body = data ? JSON.stringify(data) : undefined;
    }
    
    const res = await fetch(apiUrl, requestOptions);

    // Check if response has the expected content type for API requests
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`API Response Content-Type: ${contentType || "missing"}`);
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request failed:`, error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error));
    }
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Construct URL from query key array
    let apiUrl = queryKey[0] as string;
    
    // If there are additional parts in the query key, append them to build the full URL
    if (queryKey.length > 1) {
      for (let i = 1; i < queryKey.length; i++) {
        const part = queryKey[i];
        if (part !== null && part !== undefined) {
          apiUrl += `/${part}`;
        }
      }
    }
    
    // Ensure URL starts with /
    if (!apiUrl.startsWith('/')) {
      apiUrl = `/${apiUrl}`;
    }

    try {
      console.log(`Making query request to ${apiUrl}`);
      const res = await fetch(apiUrl, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Check if response is actually JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON response but got ${contentType || "unknown content type"}`);
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query request failed:`, error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(String(error));
      }
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});