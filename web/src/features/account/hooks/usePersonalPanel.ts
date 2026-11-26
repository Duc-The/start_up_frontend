import { accountApi } from "@/features/account/api/accountApi"

import { useState } from "react"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { toast } from "sonner"

import type { Notice } from "@/features/account/types"

export type PersonalPanelOptions = {
  kind: "favorites" | "notifications"
  userId: string
  onClose: () => void
  onSelect: (id: string) => void
}
export function usePersonalPanel(options: PersonalPanelOptions) {
  const { kind, userId, onSelect } = options
  const [page, setPage] = useState(0),
    [unread, setUnread] = useState(false)
  const client = useQueryClient()
  const favorites = useQuery({
    queryKey: ["favorites", userId, page],
    queryFn: ({ signal }) => accountApi.favorites(page, signal),
    enabled: kind === "favorites",
  })
  const notices = useQuery({
    queryKey: ["notifications", userId, page, unread],
    queryFn: ({ signal }) => accountApi.notifications(page, unread, signal),
    enabled: kind === "notifications",
  })
  const mutation = useMutation({
    mutationFn: ({ path, method }: { path: string; method: string }) =>
      accountApi.write(path, method),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["notifications"] })
      void client.invalidateQueries({ queryKey: ["unread"] })
      void client.invalidateQueries({ queryKey: ["favorites"] })
      void client.invalidateQueries({ queryKey: ["pois"] })
      void client.invalidateQueries({ queryKey: ["detail"] })
    },
    onError: (e) => toast.error(e.message),
  })
  const current = kind === "favorites" ? favorites : notices
  function follow(notice: Notice) {
    mutation.mutate({
      path: "/me/notifications/" + notice.id + "/read",
      method: "PATCH",
    })
    const match = notice.targetPath.match(/^\/pois\/([0-9a-f-]+)$/i)
    if (match) onSelect(match[1])
    else toast.info(notice.content)
  }

  return {
    page,
    setPage,
    unread,
    setUnread,
    client,
    favorites,
    notices,
    mutation,
    current,
    follow,
  }
}
