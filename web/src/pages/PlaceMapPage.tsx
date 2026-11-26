import { useNavigation } from "@/features/navigation/hooks/useNavigation"
import NavigationPanel from "@/features/navigation/components/NavigationPanel"
import {
  readableDistance,
  readableDuration,
} from "@/features/navigation/utils/navigationProgress"
import { travelModeLabels } from "@/features/directions/api/directionsApi"
import { routeSummary } from "@/features/directions/utils/routeSummary"
import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast, Toaster } from "sonner"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  History,
  Leaf,
  MapPin,
  Navigation,
  LocateFixed,
  Square,
  Search,
  UserRound,
  X,
} from "lucide-react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { poiApi } from "@/features/pois/api/poiApi"
import { accountApi } from "@/features/account/api/accountApi"
import { homeApi } from "@/features/home/api/homeApi"
import { useHome } from "@/features/home/hooks/useHome"
import { useDebounce } from "@/hooks/useDebounce"
import {
  decodePolyline,
  readRecent,
  rememberPlace,
  searchScope,
} from "@/features/home/utils/searchScope"
import { normalizeSearchText } from "@/utils/searchText"
import type { Bounds, SearchFilters } from "@/features/home/types"
import type { Position } from "@/lib/map4d"
import type { Route } from "@/features/directions/api/directionsApi"
import "@/assets/styles/discovery.css"
import "@/assets/styles/place-map.css"
const MapView = lazy(() => import("@/features/home/components/MapView"))
const PoiDetail = lazy(() => import("@/features/pois/components/PoiDialog"))
const DirectionsPanel = lazy(
  () => import("@/features/directions/components/DirectionsPanel")
)
export default function PlaceMapPage() {
  const { poiId } = useParams()
  return <PlaceMapWorkspace key={poiId} id={poiId!} />
}
function PlaceMapWorkspace({ id }: { id: string }) {
  const navigate = useNavigate(),
    location = useLocation(),
    user = useAuth(),
    client = useQueryClient()
  const state = location.state as { returnTo?: string } | null
  const returnTo =
    state?.returnTo?.startsWith("/") && !state.returnTo.startsWith("//")
      ? state.returnTo
      : "/"
  const detail = useQuery({
    queryKey: ["detail", id, "live", user?.id],
    queryFn: ({ signal }) => poiApi.detail(id, signal),
    staleTime: 60000,
  })
  const [mode, setMode] = useState<"detail" | "directions" | "results">(
    "detail"
  )
  const [collapsed, setCollapsed] = useState(false)
  const [input, setInput] = useState<string>(),
    [focused, setFocused] = useState(false)
  const [recent, setRecent] = useState(readRecent)
  const [position, setPosition] = useState<Position>()
  const [viewport, setViewport] = useState<Bounds>(),
    [bounds, setBounds] = useState<Bounds>()
  const [filters, setFilters] = useState<SearchFilters>({})
  const [previewRoute, setRoute] = useState<Route>(),
    [hovered, setHovered] = useState<string>()
  const navigation = useNavigation()
  const [following, setFollowing] = useState(true)
  const navigationOpen = navigation.state.status !== "idle"
  const manualNavigation = navigation.state.status === "preview"
  const navigating = navigation.state.status === "navigating"
  const route = navigation.state.route || previewRoute
  function startNavigation(next: Route) {
    setRoute(next)
    setFollowing(true)
    void navigation.start(next)
  }
  const keyword = useDebounce(input || "")
  const suggestions = useQuery({
    queryKey: ["suggestions", keyword],
    queryFn: ({ signal }) => homeApi.suggestions(keyword, signal),
    enabled: focused && keyword.trim().length >= 2,
    staleTime: 30000,
  })
  const { places, markers, options, searchRadius } = useHome(
    filters,
    bounds,
    user?.id,
    position
  )
  const point = useMemo(
    () =>
      detail.data?.lat != null && detail.data.lng != null
        ? { lat: detail.data.lat, lng: detail.data.lng }
        : undefined,
    [detail.data]
  )
  const mapMarkers = useMemo(() => {
    const list = markers.data?.items || []
    return point && detail.data && !list.some((p) => p.id === id)
      ? [
          ...list,
          {
            ...point,
            id,
            name: detail.data.poi.name,
            categories: detail.data.poi.categories,
          },
        ]
      : list
  }, [markers.data, point, detail.data, id])
  const path = useMemo(() => {
    try {
      return route?.overviewPolyline
        ? decodePolyline(route.overviewPolyline)
        : undefined
    } catch {
      return undefined
    }
  }, [route])
  useEffect(() => {
    if (detail.data) {
      document.title = detail.data.poi.name + " · OCOP GO"
      rememberPlace({ id, name: detail.data.poi.name })
    }
    return () => {
      document.title = "OCOP GO — Chạm OCOP, khám phá Đà Nẵng"
    }
  }, [detail.data, id])
  const favorite = useMutation({
    mutationFn: ({ poiId, saved }: { poiId: string; saved: boolean }) =>
      accountApi.favorite(poiId, saved),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["detail"] })
      void client.invalidateQueries({ queryKey: ["favorites"] })
      void client.invalidateQueries({ queryKey: ["pois"] })
    },
    onError: (e) => toast.error(e.message),
  })
  function save(poiId: string, saved: boolean) {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } })
      return
    }
    if (!favorite.isPending) favorite.mutate({ poiId, saved })
  }
  function select(nextId: string) {
    navigation.stop()
    if (nextId === id) {
      setMode("detail")
      setInput(undefined)
      setFocused(false)
      setCollapsed(false)
      setRoute(undefined)
    } else navigate("/places/" + nextId, { state: { returnTo } })
  }
  function locate() {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt chưa hỗ trợ định vị.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () =>
        toast.error(
          "Chưa lấy được vị trí. Bạn có thể chọn điểm đi trong hệ thống."
        ),
      { timeout: 12000, maximumAge: 60000 }
    )
  }
  async function submit() {
    navigation.stop()
    const text = (input ?? detail.data?.poi.name ?? "").trim()
    setFocused(false)
    if (!text) {
      setMode("detail")
      return
    }
    try {
      const found = await homeApi.suggestions(text)
      const exact = found.find(
        (p) =>
          p.type === "POI" &&
          normalizeSearchText(p.name) === normalizeSearchText(text)
      )
      if (exact) {
        select(exact.id)
        return
      }
      const scope = searchScope({}, viewport, position)
      setFilters({ ...scope.filters, keyword: text, page: "0" })
      setBounds(scope.bounds)
      setMode("results")
      setCollapsed(false)
      setRoute(undefined)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chưa thể tìm kiếm")
    }
  }
  function directions() {
    setRecent(readRecent())
    if (!point) {
      toast.error("Địa điểm đang cập nhật tọa độ để chỉ đường.")
      return
    }
    setMode("directions")
    setCollapsed(false)
    setFocused(false)
  }
  const summary = route ? routeSummary(route) : undefined
  return (
    <>
      <Toaster richColors position="top-right" />
      <main
        className={"place-map-app" + (collapsed ? " sidebar-collapsed" : "")}
      >
        <section className="map-app-sidebar" aria-label="Thông tin địa điểm">
          <div className="map-app-search">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <Link to={returnTo} aria-label="Quay về danh sách">
                <ArrowLeft size={20} />
              </Link>
              <input
                aria-label="Tìm địa điểm trên bản đồ"
                value={input ?? detail.data?.poi.name ?? ""}
                placeholder="Tìm địa điểm OCOP…"
                onFocus={() => {
                  setRecent(readRecent())
                  setFocused(true)
                }}
                onBlur={() => setTimeout(() => setFocused(false), 180)}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" aria-label="Tìm kiếm">
                <Search size={20} />
              </button>
              <button
                type="button"
                aria-label="Đóng địa điểm"
                onClick={() => navigate(returnTo)}
              >
                <X size={20} />
              </button>
            </form>
            {focused && (
              <div className="map-app-suggestions">
                {keyword.length >= 2 ? (
                  suggestions.isFetching ? (
                    <p>Đang tìm địa điểm…</p>
                  ) : suggestions.error ? (
                    <p>Chưa tải được gợi ý. Hãy thử lại.</p>
                  ) : suggestions.data?.filter((s) => s.type === "POI")
                      .length ? (
                    suggestions.data
                      .filter((s) => s.type === "POI")
                      .map((s) => (
                        <button key={s.id} onClick={() => select(s.id)}>
                          <MapPin size={17} />
                          <span>
                            {s.name}
                            <small>Địa điểm trong OCOP GO</small>
                          </span>
                        </button>
                      ))
                  ) : (
                    <p>Không có địa điểm phù hợp.</p>
                  )
                ) : (
                  <>
                    <h3>Tìm kiếm gần đây</h3>
                    {recent.map((p) => (
                      <button key={p.id} onClick={() => select(p.id)}>
                        <History size={17} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                    {!recent.length && <p>Chưa có địa điểm đã xem.</p>}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="map-app-sidebar-body">
            <Suspense
              fallback={<div className="loading-block">Đang tải địa điểm…</div>}
            >
              {navigationOpen ? (
                <NavigationPanel
                  state={navigation.state}
                  onUseGps={() => {
                    if (route) {
                      setFollowing(true)
                      void navigation.startFromGps(route)
                    }
                  }}
                  onStop={navigation.stop}
                  following={following}
                  onRecenter={() => setFollowing(true)}
                />
              ) : mode === "directions" ? (
                <DirectionsPanel
                  destination={detail.data}
                  initialRoute={previewRoute}
                  onStart={startNavigation}
                  position={position}
                  onLocate={locate}
                  onClose={() => {
                    setMode("detail")
                    setRoute(undefined)
                  }}
                  recent={recent}
                  onClearRecent={(item) => {
                    const next = item ? recent.filter((p) => p.id !== item) : []
                    setRecent(next)
                    try {
                      localStorage.setItem(
                        "ocop:recent-places:v1",
                        JSON.stringify(next)
                      )
                    } catch {
                      /* optional storage */
                    }
                  }}
                  onRoute={setRoute}
                />
              ) : mode === "detail" ? (
                <PoiDetail
                  id={id}
                  pageView
                  onClose={() => navigate(returnTo)}
                  onDirections={directions}
                  onFavorite={save}
                />
              ) : (
                <div className="map-app-results">
                  <div className="map-results-title">
                    <h1>{filters.keyword || "Địa điểm gần đây"}</h1>
                    <p>
                      {places.data?.total ?? 0} địa điểm ·{" "}
                      {searchRadius
                        ? searchRadius / 1000 + " km"
                        : "Trong khu vực đang xem"}
                    </p>
                  </div>
                  {places.isPending ? (
                    <p className="loading-block">Đang tìm kiếm…</p>
                  ) : places.error ? (
                    <p role="alert">{places.error.message}</p>
                  ) : places.data?.items.length ? (
                    places.data.items.map((p) => (
                      <button
                        className="map-result-item"
                        key={p.id}
                        onMouseEnter={() => setHovered(p.id)}
                        onMouseLeave={() => setHovered(undefined)}
                        onFocus={() => setHovered(p.id)}
                        onClick={() => select(p.id)}
                      >
                        <div>
                          <h2>{p.name}</h2>
                          <span>
                            {p.categories[0]?.name || "Địa điểm OCOP"}
                          </span>
                          <p>{p.address}</p>
                        </div>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} />
                        ) : (
                          <Leaf size={25} />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="empty-inline">
                      Chưa có địa điểm phù hợp trong khu vực này.
                    </p>
                  )}
                  <button
                    className="button secondary"
                    onClick={() => {
                      setMode("detail")
                      setInput(undefined)
                    }}
                  >
                    Quay lại địa điểm
                  </button>
                </div>
              )}
            </Suspense>
          </div>
        </section>
        <section className="map-app-map" aria-label="Bản đồ địa điểm">
          <Suspense
            fallback={<div className="loading-block">Đang tải bản đồ…</div>}
          >
            <MapView
              fullPage
              markers={mapMarkers}
              selected={mode === "results" ? undefined : id}
              selectedPoint={mode === "results" ? undefined : point}
              hovered={hovered}
              routePath={path}
              routeOriginName={route?.origin?.name}
              routeDestinationName={route?.destination?.name}
              location={
                manualNavigation ? undefined : navigation.state.fix || position
              }
              locationHeading={navigation.state.fix?.heading}
              navigating={navigating}
              following={following}
              onUserPan={() => setFollowing(false)}
              onLocate={locate}
              onSelect={select}
              onBounds={setViewport}
            />
          </Suspense>
          <div className="map-app-topbar">
            <div className="map-category-list">
              {options.data?.categories.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    navigation.stop()
                    setFilters({ categoryIds: [c.id] })
                    setBounds(viewport)
                    setMode("results")
                    setInput(c.name)
                    setCollapsed(false)
                    setRoute(undefined)
                  }}
                >
                  <MapPin size={16} />
                  {c.name}
                </button>
              ))}
            </div>
            <Link
              className="map-account-link"
              to={user ? "/" : "/login"}
              title={user?.displayName || "Đăng nhập"}
            >
              <UserRound size={22} />
            </Link>
          </div>
          <button
            className="map-sidebar-toggle"
            aria-label={
              collapsed ? "Mở thông tin địa điểm" : "Thu gọn thông tin địa điểm"
            }
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
          </button>
          {mode === "results" && (
            <button
              className="map-search-region"
              onClick={() => {
                const scope = searchScope(filters, viewport, position)
                setFilters({ ...scope.filters, page: "0" })
                setBounds(scope.bounds)
              }}
            >
              <Search size={16} />
              Tìm trong khu vực này
            </button>
          )}
          {detail.data && !point && (
            <div className="map-coordinate-notice">
              Địa điểm đang cập nhật vị trí trên bản đồ.
            </div>
          )}
          {navigation.state.error && (
            <div className="navigation-error" role="alert">
              {navigation.state.error}
            </div>
          )}
          {navigationOpen && (
            <div className="navigation-map-instruction" role="status">
              <Navigation size={25} />
              <div>
                <strong>
                  {navigation.state.status === "starting"
                    ? "Đang lấy vị trí GPS…"
                    : navigation.state.status === "arrived"
                      ? "Bạn đã đến điểm đến"
                      : navigation.state.recalculating
                        ? "Đang tìm lại đường…"
                        : navigation.state.nextInstruction}
                </strong>
                {navigating && (
                  <span>{readableDistance(navigation.state.nextMeters)}</span>
                )}
              </div>
            </div>
          )}
          {navigating && !following && (
            <button
              className="navigation-recenter-map"
              onClick={() => setFollowing(true)}
            >
              <LocateFixed size={18} />
              Về vị trí của tôi
            </button>
          )}
          {navigationOpen && navigation.state.status !== "starting" && (
            <div
              className="map-route-summary navigation-live-summary"
              role="status"
            >
              <div>
                <strong>
                  {navigation.state.status === "arrived"
                    ? "Đã đến nơi"
                    : readableDuration(navigation.state.remainingSeconds)}
                </strong>
                <span>
                  {readableDistance(navigation.state.remainingMeters)}{" "}
                  {manualNavigation ? "toàn tuyến" : "còn lại"} ·{" "}
                  {route?.destination?.name}
                </span>
                <small>
                  {navigation.state.warning ||
                    (manualNavigation
                      ? "Từ điểm đi đã chọn · Chưa bật GPS"
                      : "Dẫn đường GPS trực tiếp · Thời gian còn lại dự kiến")}
                </small>
              </div>
              <button
                onClick={navigation.stop}
                aria-label={
                  manualNavigation ? "Kết thúc xem lộ trình" : "Dừng dẫn đường"
                }
              >
                <Square size={17} />
                {navigation.state.status === "arrived" || manualNavigation
                  ? "Kết thúc"
                  : "Dừng"}
              </button>
            </div>
          )}
          {summary && !navigationOpen && (
            <div className="map-route-summary" role="status" aria-live="polite">
              <div className="map-route-summary-icon">
                <Navigation size={23} />
              </div>
              <div>
                <strong>{summary.duration}</strong>
                <span>
                  {summary.distance} · {route?.summary || "Lộ trình đang chọn"}
                </span>
                <small>
                  {route?.travelMode ? travelModeLabels[route.travelMode] : ""}{" "}
                  · Thời gian dự kiến
                </small>
                <dl className="route-location-summary">
                  <div>
                    <dt>Điểm đi</dt>
                    <dd>{route?.origin?.name || "Chưa xác định"}</dd>
                  </div>
                  <div>
                    <dt>Điểm đến</dt>
                    <dd>{route?.destination?.name || "Chưa xác định"}</dd>
                  </div>
                </dl>
                {route?.destination && (
                  <button
                    className="navigation-start-map"
                    onClick={() => startNavigation(route)}
                  >
                    <Navigation size={16} />
                    Bắt đầu
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="map-app-credit">
            <Leaf size={13} />
            <strong>OCOP GO</strong>
            <span>Khám phá giá trị địa phương</span>
          </div>
        </section>
      </main>
    </>
  )
}
