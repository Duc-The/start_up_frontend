import { api } from "@/services/httpClient"
import type { Detail, Product, Review } from "../types"
import type { PageData } from "@/types/api"
export const poiApi = {
  detail: (id: string, signal?: AbortSignal) =>
    api<Detail>("/pois/" + id, { signal }),
  products: (id: string, page: number, signal?: AbortSignal) =>
    api<PageData<Product>>(
      "/pois/" + id + "/products?page=" + page + "&size=8",
      { signal }
    ),
  reviews: (id: string, page: number, signal?: AbortSignal) =>
    api<PageData<Review>>("/pois/" + id + "/reviews?page=" + page + "&size=8", {
      signal,
    }),
}
