import { useNavigate } from "react-router-dom"
import { normalizeSearchText } from "@/utils/searchText"
import { poiApi } from "@/features/pois/api/poiApi"
import {
  readRecent,
  rememberPlace,
  recentKey,
  searchScope,
} from "../utils/searchScope"
import { homeApi } from "@/features/home/api/homeApi"

import { accountApi } from "@/features/account/api/accountApi"

import { useCallback } from "react"

import { useMutation } from "@tanstack/react-query"

import { toast } from "sonner"

import type { Group } from "@/features/home/types"

import { flatten } from "@/utils/options"

import { groups } from "@/features/home/utils/searchFilters"

import { useEffect, useMemo, useRef, useState } from "react"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { params } from "@/services/httpClient"

import { useAuth } from "@/features/auth/hooks/useAuth"

import { useDebounce } from "@/hooks/useDebounce"

import { readFilters } from "@/features/home/utils/searchFilters"

import { useHome } from "@/features/home/hooks/useHome"

import type { Bounds, SearchFilters } from "@/features/home/types"

export function useHomePage() {
  const navigate = useNavigate()
  const user = useAuth(),
    client = useQueryClient()
  const [applied, setApplied] = useState<SearchFilters>(readFilters),
    [draft, setDraft] = useState<SearchFilters>(readFilters)
  const [keyword, setKeyword] = useState(() => readFilters().keyword || ""),
    [focused, setFocused] = useState(false)
  const [bounds, setBounds] = useState<Bounds>()
  const [viewport, setViewport] = useState<Bounds>()
  const [hovered, setHovered] = useState<string>()
  const [directions, setDirections] = useState(false)
  const [recent, setRecent] = useState(readRecent)
  const [detail, setDetail] = useState<string | undefined>(
    () => new URLSearchParams(location.search).get("poi") || undefined
  )
  const [selectionName, setSelectionName] = useState<string>()
  const selectedDetail = useQuery({
    queryKey: ["detail", detail, "live", user?.id],
    queryFn: ({ signal }) => poiApi.detail(detail!, signal),
    enabled: !!detail,
    staleTime: 60000,
  })
  const displayKeyword = selectedDetail.data?.poi.name || selectionName
  const lastRecorded = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (selectedDetail.data && detail !== lastRecorded.current) {
      lastRecorded.current = detail
      setRecent(
        rememberPlace({
          id: selectedDetail.data.poi.id,
          name: selectedDetail.data.poi.name,
        })
      )
    }
  }, [selectedDetail.data, detail])
  const [sidebar, setSidebar] = useState(false),
    [mobileList, setMobileList] = useState(false),
    [account, setAccount] = useState(false)
  const [auth, setAuth] = useState(false),
    [personal, setPersonal] = useState<"favorites" | "notifications" | null>(
      null
    )
  const [selected, setSelected] = useState<string | undefined>(
      () => new URLSearchParams(location.search).get("poi") || undefined
    ),
    [locating, setLocating] = useState(false),
    [position, setPosition] = useState<{ lat: number; lng: number }>()
  const debounced = useDebounce(keyword)
  const effective = useMemo(
    () => ({ ...applied, keyword: debounced }),
    [applied, debounced]
  )
  const { options, places, markers, searchRadius, scopeError } = useHome(
    effective,
    bounds,
    user?.id,
    position
  )
  const search = useQuery({
    queryKey: ["suggestions", debounced],
    queryFn: ({ signal }) => homeApi.suggestions(debounced, signal),
    enabled: focused && debounced.trim().length >= 2,
    staleTime: 30000,
  })
  const unread = useQuery({
    queryKey: ["unread", user?.id],
    queryFn: ({ signal }) => accountApi.unread(signal),
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  })
  const previousUser = useRef(user?.id)
  useEffect(() => {
    if (previousUser.current !== user?.id) {
      client.removeQueries({ queryKey: ["favorites"] })
      client.removeQueries({ queryKey: ["notifications"] })
      void client.invalidateQueries({ queryKey: ["pois"] })
      void client.invalidateQueries({ queryKey: ["detail"] })
      previousUser.current = user?.id
    }
  }, [user?.id, client])
  useEffect(() => {
    const query = params({ ...effective, poi: detail })
    history.replaceState(
      null,
      "",
      location.pathname + (query ? "?" + query : "")
    )
  }, [effective, detail]) // URL contains applied filters, not transient map bounds.
  useEffect(() => {
    const restore = () => {
      const next = readFilters()
      setApplied(next)
      setDraft(next)
      setKeyword(next.keyword || "")
      setDetail(new URLSearchParams(location.search).get("poi") || undefined)
    }
    window.addEventListener("popstate", restore)
    return () => window.removeEventListener("popstate", restore)
  }, [])
  const initialBounds = useRef(false)
  const updateBounds = useCallback((next: Bounds) => {
    if (!initialBounds.current) {
      initialBounds.current = true
      setBounds(next)
    }
    setViewport((old) =>
      JSON.stringify(old) === JSON.stringify(next) ? old : next
    )
  }, [])
  const favorite = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      accountApi.favorite(id, saved),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["pois"] })
      void client.invalidateQueries({ queryKey: ["detail"] })
      void client.invalidateQueries({ queryKey: ["favorites"] })
    },
    onError: (e) => toast.error(e.message),
  })
  function save(id: string, saved: boolean) {
    if (!user) {
      setAuth(true)
      return
    }
    if (!favorite.isPending) favorite.mutate({ id, saved })
  }
  function locate() {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt chưa hỗ trợ định vị.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (result) => {
        const p = { lat: result.coords.latitude, lng: result.coords.longitude }
        setPosition(p)
        const scope = searchScope(applied, viewport, p)
        setBounds(scope.bounds)
        const next = {
          ...applied,
          ...scope.filters,
          page: "0",
        }
        setApplied(next)
        setDraft(next)
        setLocating(false)
        toast.success(
          "Đã xác định vị trí. Kết quả sẽ tìm quanh bạn khi bạn ở trong vùng bản đồ."
        )
      },
      () => {
        setLocating(false)
        toast.error(
          "Chưa thể lấy vị trí. Hãy cho phép quyền vị trí và thử lại."
        )
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    )
  }
  function select(id: string, _name?: string) {
    void _name
    navigate("/places/" + id, {
      state: { returnTo: location.pathname + location.search },
    })
  }
  function reset() {
    setApplied({})
    setDraft({})
    setKeyword("")
    setDetail(undefined)
    setSelectionName(undefined)
    setSelected(undefined)
    setBounds(undefined)
  }
  function openGroup(id: Group) {
    setSidebar(true)
    requestAnimationFrame(() =>
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    )
  }
  function remove(group: Group, id: string) {
    const next = {
      ...applied,
      [group]: (applied[group] || []).filter((v) => v !== id),
      page: "0",
    }
    setApplied(next)
    setDraft(next)
  }
  const groupOptions = options.data
    ? {
        areaIds: flatten(options.data.areas),
        productTypeIds: flatten(options.data.productTypes),
        categoryIds: flatten(options.data.categories),
        activityIds: flatten(options.data.activities),
        amenityIds: flatten(options.data.amenities),
        ocopStars: options.data.ocopStars.map((s) => ({
          id: String(s),
          name: s + " sao OCOP",
        })),
      }
    : undefined
  const chips = groups.flatMap((group) =>
    (applied[group] || []).map((id) => ({
      group,
      id,
      name: groupOptions?.[group].find((o) => o.id === id)?.name || id,
    }))
  )
  const selectedCount = chips.length + (applied.radiusMeters ? 1 : 0)

  function closeDetail() {
    setDetail(undefined)
    setSelectionName(undefined)
    setSelected(undefined)
  }
  async function submitSearch() {
    setFocused(false)
    closeDetail()
    setDirections(false)
    const exact = (await homeApi.suggestions(keyword)).filter(
      (p) =>
        p.type === "POI" &&
        normalizeSearchText(p.name) === normalizeSearchText(keyword)
    )
    if (exact.length === 1) {
      select(exact[0].id, exact[0].name)
      return
    }
    const scope = searchScope(applied, viewport, position)
    setApplied({ ...scope.filters, page: "0" })
    setBounds(scope.bounds)
  }
  function searchViewport() {
    closeDetail()
    const scope = searchScope(applied, viewport, position)
    setApplied({ ...scope.filters, page: "0" })
    setBounds(scope.bounds)
  }
  function changeKeyword(value: string) {
    closeDetail()
    setDirections(false)
    setKeyword(value)
    const scope = searchScope(applied, viewport, position)
    setApplied({ ...scope.filters, page: "0" })
    setBounds(scope.bounds)
  }
  function clearRecent(id?: string) {
    const next = id ? recent.filter((p) => p.id !== id) : []
    setRecent(next)
    try {
      localStorage.setItem(recentKey, JSON.stringify(next))
    } catch {
      /* Storage is optional. */
    }
  }
  return {
    hovered,
    setHovered,
    directions,
    setDirections,
    recent,
    clearRecent,
    viewport,
    searchViewport,
    displayKeyword: detail ? displayKeyword : undefined,
    closeDetail,
    submitSearch,
    changeKeyword,
    searchRadius,
    scopeError,
    selectedPoi: selectedDetail.data,
    user,
    client,
    applied,
    setApplied,
    draft,
    setDraft,
    keyword,
    setKeyword,
    focused,
    setFocused,
    bounds,
    setBounds,
    sidebar,
    setSidebar,
    mobileList,
    setMobileList,
    account,
    setAccount,
    auth,
    setAuth,
    personal,
    setPersonal,
    detail,
    setDetail,
    selected,
    setSelected,
    locating,
    setLocating,
    position,
    setPosition,
    debounced,
    effective,
    options,
    places,
    markers,
    search,
    unread,
    previousUser,
    updateBounds,
    favorite,
    save,
    locate,
    select,
    reset,
    openGroup,
    remove,
    groupOptions,
    chips,
    selectedCount,
  }
}
