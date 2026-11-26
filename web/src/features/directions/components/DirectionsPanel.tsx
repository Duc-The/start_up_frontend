import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Select, ConfigProvider } from "antd"
import {
  ArrowDownUp,
  Car,
  Bike,
  Footprints,
  Plus,
  X,
  LocateFixed,
  Route as RouteIcon,
  Clock3,
  Navigation,
  MapPin,
} from "lucide-react"
import { homeApi } from "@/features/home/api/homeApi"
import { poiApi } from "@/features/pois/api/poiApi"
import { useDebounce } from "@/hooks/useDebounce"
import type { Position } from "@/lib/map4d"
import type { Detail } from "@/features/pois/types"
import type { RecentPlace } from "@/features/home/utils/searchScope"
import {
  directionsApi,
  travelModeLabels,
  type TravelMode,
  type Route,
} from "../api/directionsApi"
import { antdTheme } from "@/lib/antdTheme"
import { toast } from "sonner"
export interface RoutePoint extends Position {
  id: string
  name: string
}
const gpsId = "current-location"
function PlacePicker({
  label,
  value,
  onChange,
  position,
  onLocate,
}: {
  label: string
  value?: RoutePoint
  onChange: (p?: RoutePoint) => void
  position?: Position
  onLocate: () => void
}) {
  const [text, setText] = useState("")
  const keyword = useDebounce(text)
  const [resolving, setResolving] = useState(false)
  const suggestions = useQuery({
    queryKey: ["route-suggestions", keyword],
    queryFn: ({ signal }) => homeApi.suggestions(keyword, signal),
    enabled: keyword.trim().length >= 2,
    staleTime: 30000,
  })
  const options = [
    ...(position ? [{ value: gpsId, label: "Vị trí hiện tại" }] : []),
    ...(suggestions.data || [])
      .filter((p) => p.type === "POI")
      .map((p) => ({ value: p.id, label: p.name })),
  ]
  if (value && !options.some((p) => p.value === value.id))
    options.unshift({ value: value.id, label: value.name })
  async function choose(id?: string) {
    if (!id) {
      onChange(undefined)
      return
    }
    if (id === gpsId && position) {
      onChange({ ...position, id: gpsId, name: "Vị trí hiện tại" })
      return
    }
    setResolving(true)
    try {
      const d = await poiApi.detail(id)
      if (d.lat == null || d.lng == null) {
        toast.error("Địa điểm chưa có tọa độ để chỉ đường.")
        return
      }
      onChange({ id, name: d.poi.name, lat: d.lat, lng: d.lng })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chưa tải được địa điểm")
    } finally {
      setResolving(false)
    }
  }
  return (
    <div className="route-field">
      <label>{label}</label>
      <div>
        <Select
          aria-label={label}
          value={value?.id}
          options={options}
          allowClear
          loading={suggestions.isFetching || resolving}
          placeholder={
            label === "Điểm đi"
              ? "Vị trí hiện tại · Cần cho phép định vị"
              : "Gõ tên địa điểm trong hệ thống…"
          }
          showSearch={{ filterOption: false, onSearch: setText }}
          onChange={(id) => void choose(id)}
          notFoundContent={
            suggestions.error
              ? "Chưa tải được gợi ý"
              : text.length < 2
                ? "Nhập ít nhất 2 ký tự"
                : "Không có địa điểm phù hợp"
          }
        />
        <button
          className="icon-button"
          title="Lấy vị trí hiện tại"
          onClick={onLocate}
        >
          <LocateFixed size={17} />
        </button>
      </div>
    </div>
  )
}
export default function DirectionsPanel({
  destination,
  position,
  onLocate,
  onClose,
  recent,
  onClearRecent,
  onRoute,
  initialRoute,
  onStart,
}: {
  destination?: Detail
  position?: Position
  onLocate: () => void
  onClose: () => void
  recent: RecentPlace[]
  onClearRecent: (id?: string) => void
  initialRoute?: Route
  onStart?: (route: Route) => void
  onRoute: (route?: Route) => void
}) {
  const [origin, setOrigin] = useState<RoutePoint | undefined>(
    initialRoute?.origin ||
      (position
        ? { ...position, id: gpsId, name: "Vị trí hiện tại" }
        : undefined)
  )
  const [useGps, setUseGps] = useState(
    !initialRoute?.origin || initialRoute.origin.id === gpsId
  )
  const currentOrigin =
    useGps && position
      ? { ...position, id: gpsId, name: "Vị trí hiện tại" }
      : origin
  const [target, setTarget] = useState<RoutePoint | undefined>(
    initialRoute?.destination ||
      (destination?.lat != null && destination.lng != null
        ? {
            id: destination.poi.id,
            name: destination.poi.name,
            lat: destination.lat,
            lng: destination.lng,
          }
        : undefined)
  )
  const [stops, setStops] = useState<(RoutePoint | undefined)[]>(
    initialRoute?.waypoints || []
  )
  const [mode, setMode] = useState<TravelMode>(
    initialRoute?.travelMode || "car"
  )
  const [request, setRequest] = useState<{
    points: RoutePoint[]
    mode: TravelMode
  }>()
  const [active, setActive] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const result = useQuery({
    queryKey: ["directions", request],
    queryFn: ({ signal }) =>
      directionsApi(request!.points, request!.mode, signal),
    enabled: !!request,
    staleTime: 60000,
    retry: false,
  })
  const picked = result.data?.routes[active]
  const selectedRoute = useMemo(
    () =>
      picked && request
        ? {
            ...picked,
            travelMode: request.mode,
            origin: request.points[0],
            destination: request.points[request.points.length - 1],
            waypoints: request.points.slice(1, -1),
          }
        : undefined,
    [picked, request]
  )
  useEffect(() => {
    if (request) onRoute(selectedRoute)
  }, [selectedRoute, onRoute, request])
  function clearRoute() {
    setRequest(undefined)
    onRoute(undefined)
  }
  return (
    <ConfigProvider theme={antdTheme}>
      <aside
        className={"directions-panel" + (minimized ? " is-minimized" : "")}
        aria-label="Chỉ đường"
      >
        <header>
          <div>
            <RouteIcon size={21} />
            <h2>Lên đường khám phá</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Đóng chỉ đường"
          >
            <X size={20} />
          </button>
        </header>
        {picked && (
          <button
            className="route-map-toggle"
            onClick={() => setMinimized(!minimized)}
          >
            {minimized ? "Xem hướng dẫn chi tiết" : "Thu gọn để xem bản đồ"}
          </button>
        )}
        <div className="travel-modes">
          {[
            { id: "car", name: "Ô tô", Icon: Car },
            { id: "motorcycle", name: "Xe máy", Icon: Bike },
            { id: "foot", name: "Đi bộ", Icon: Footprints },
          ].map(({ id, name, Icon }) => (
            <button
              key={id}
              className={mode === id ? "active" : ""}
              aria-pressed={mode === id}
              onClick={() => {
                const nextMode = id as TravelMode
                setMode(nextMode)
                setActive(0)
                if (request) setRequest({ ...request, mode: nextMode })
                else clearRoute()
              }}
            >
              <Icon size={19} />
              {name}
            </button>
          ))}
        </div>
        <PlacePicker
          label="Điểm đi"
          value={currentOrigin}
          position={position}
          onLocate={onLocate}
          onChange={(p) => {
            setUseGps(p?.id === gpsId)
            setOrigin(p)
            clearRoute()
          }}
        />
        {!position && useGps && (
          <button className="route-gps" onClick={onLocate}>
            <LocateFixed size={15} />
            Dùng vị trí hiện tại · Cho phép định vị
          </button>
        )}
        <button
          className="route-swap"
          onClick={() => {
            setOrigin(target)
            setUseGps(target?.id === gpsId)
            setTarget(currentOrigin)
            setStops([...stops].reverse())
            clearRoute()
          }}
        >
          <ArrowDownUp size={16} />
          Đổi điểm đi và điểm đến
        </button>
        {stops.map((p, i) => (
          <div className="route-stop" key={i}>
            <PlacePicker
              label={"Điểm dừng " + (i + 1)}
              value={p}
              position={position}
              onLocate={onLocate}
              onChange={(next) => {
                setStops(stops.map((v, n) => (n === i ? next : v)))
                clearRoute()
              }}
            />
            <button
              className="icon-button"
              aria-label={"Xóa điểm dừng " + (i + 1)}
              onClick={() => {
                setStops(stops.filter((_, n) => n !== i))
                clearRoute()
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
        <PlacePicker
          label="Điểm đến"
          value={target}
          position={position}
          onLocate={onLocate}
          onChange={(p) => {
            setTarget(p)
            clearRoute()
          }}
        />
        <div className="route-actions">
          <button
            disabled={stops.length >= 5}
            onClick={() => {
              setStops([...stops, undefined])
              clearRoute()
            }}
          >
            <Plus size={15} />
            Thêm điểm dừng
          </button>
          <small>Tối đa 5 điểm</small>
        </div>
        <button
          className="button primary route-submit"
          disabled={
            !currentOrigin ||
            !target ||
            stops.some((p) => !p) ||
            result.isFetching
          }
          onClick={() => {
            setActive(0)
            setRequest({
              points: [
                currentOrigin!,
                ...stops.filter((p): p is RoutePoint => !!p),
                target!,
              ],
              mode,
            })
          }}
        >
          <RouteIcon size={17} />
          {result.isFetching ? "Đang tìm lộ trình…" : "Tìm đường đi"}
        </button>
        {onStart && (selectedRoute || initialRoute) && (
          <button
            className="button primary navigation-start-panel"
            onClick={() => onStart((selectedRoute || initialRoute)!)}
          >
            <Navigation size={17} />
            Bắt đầu dẫn đường
          </button>
        )}
        {result.error && (
          <div className="route-error" role="alert">
            {result.error.message}
            <button onClick={() => void result.refetch()}>Thử lại</button>
          </div>
        )}
        {result.data && (
          <div className="route-results">
            <p className="route-mode-caption">
              {travelModeLabels[request?.mode || mode]} ·{" "}
              {request?.mode === "foot"
                ? "Lộ trình đi bộ"
                : "Ưu tiên thời gian di chuyển ngắn nhất"}
            </p>
            {result.data.routes.map((route, i) => (
              <button
                className={
                  active === i ? "route-option active" : "route-option"
                }
                key={i}
                onClick={() => {
                  setActive(i)
                }}
              >
                <strong>{route.summary || "Lộ trình " + (i + 1)}</strong>
                <span>
                  <Clock3 size={14} />
                  {route.duration?.text ||
                    Math.ceil(
                      route.legs.reduce((n, l) => n + l.duration.value, 0) / 60
                    ) + " phút"}{" "}
                  ·{" "}
                  {route.distance?.text ||
                    (
                      route.legs.reduce((n, l) => n + l.distance.value, 0) /
                      1000
                    ).toFixed(1) + " km"}
                </span>
                <small>
                  {active === i
                    ? "Đang hiển thị trên bản đồ"
                    : "Bấm để chọn tuyến đường này"}
                </small>
              </button>
            ))}
            {picked && (
              <ol className="route-steps">
                {picked.legs
                  .flatMap((l) => l.steps || [])
                  .map((step, i) => (
                    <li key={i}>
                      <span>
                        {(
                          step.htmlInstructions ||
                          step.streetName ||
                          "Tiếp tục di chuyển"
                        ).replace(/<[^>]*>/g, " ")}
                      </span>
                      <small>{step.distance?.text}</small>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        )}
        {!request && (
          <div className="route-recent">
            <div>
              <h3>Tìm kiếm gần đây</h3>
              {recent.length > 0 && (
                <button onClick={() => onClearRecent()}>Xóa hết</button>
              )}
            </div>
            {recent.length ? (
              recent.map((p) => (
                <div key={p.id}>
                  <button
                    onClick={() => {
                      void poiApi
                        .detail(p.id)
                        .then((d) => {
                          if (d.lat == null || d.lng == null) {
                            toast.error("Địa điểm chưa có tọa độ để chỉ đường.")
                            return
                          }
                          setTarget({
                            id: d.poi.id,
                            name: d.poi.name,
                            lat: d.lat,
                            lng: d.lng,
                          })
                          clearRoute()
                        })
                        .catch((e) => toast.error(e.message))
                    }}
                  >
                    <MapPin size={16} />
                    {p.name}
                  </button>
                  <button
                    aria-label={"Xóa lịch sử " + p.name}
                    onClick={() => onClearRecent(p.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p>Những địa điểm bạn xem sẽ xuất hiện ở đây.</p>
            )}
          </div>
        )}
      </aside>
    </ConfigProvider>
  )
}
