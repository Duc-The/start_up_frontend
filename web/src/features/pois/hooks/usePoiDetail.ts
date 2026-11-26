import { useAuth } from "@/features/auth/hooks/useAuth"
import { poiApi } from "@/features/pois/api/poiApi"

import { useState } from "react"

import { useQuery } from "@tanstack/react-query"

export function usePoiDetail(id: string) {
  const user = useAuth()
  const [tab, setTab] = useState("Thông tin")
  const detail = useQuery({
    queryKey: ["detail", id, "live", user?.id],
    queryFn: ({ signal }) => poiApi.detail(id, signal),
    staleTime: 60000,
  })
  const [page, setPage] = useState(0)
  const products = useQuery({
    queryKey: ["poi-products", id, page],
    queryFn: ({ signal }) => poiApi.products(id, page, signal),
    enabled: tab === "Sản phẩm",
  })
  const reviews = useQuery({
    queryKey: ["poi-reviews", id, page],
    queryFn: ({ signal }) => poiApi.reviews(id, page, signal),
    enabled: tab === "Đánh giá",
  })
  const data = detail.data
  const active = tab === "Sản phẩm" ? products : reviews

  return { tab, setTab, detail, page, setPage, products, reviews, data, active }
}
