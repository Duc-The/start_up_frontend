import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/services/httpClient"
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (count, error) =>
        count < 1 &&
        !(error instanceof ApiError && error.status > 0 && error.status < 500),
    },
    mutations: { retry: false },
  },
})
