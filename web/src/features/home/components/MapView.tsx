import { routeCamera } from "../utils/searchScope"
import { useEffect, useRef, useState } from "react"
import {
  Layers,
  LocateFixed,
  MapPinned,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react"
import { loadMap, mapBounds } from "@/lib/map4d"
import type { MapInstance, MarkerInstance, Position } from "@/lib/map4d"
import type { Marker } from "@/features/pois/types"
import type { Bounds } from "@/features/home/types"
interface Props {
  navigating?: boolean
  following?: boolean
  onUserPan?: () => void
  locationHeading?: number | null
  fullPage?: boolean
  markers: Marker[]
  hovered?: string
  routePath?: Position[]
  routeOriginName?: string
  routeDestinationName?: string
  selectedPoint?: Position
  selected?: string
  onSelect: (id: string) => void
  onBounds: (bounds: Bounds) => void
  onLocate: () => void
  location?: Position
}
export default function MapView({
  markers,
  navigating = false,
  following = true,
  onUserPan,
  locationHeading,
  fullPage = false,
  selected,
  hovered,
  routePath,
  routeOriginName,
  routeDestinationName,
  selectedPoint,
  onSelect,
  onBounds,
  onLocate,
  location,
}: Props) {
  const element = useRef<HTMLDivElement>(null),
    map = useRef<MapInstance | null>(null)
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null)
  const selectRef = useRef(onSelect),
    boundsRef = useRef(onBounds)
  const [status, setStatus] = useState("Đang tải bản đồ Đà Nẵng…"),
    [ready, setReady] = useState(false),
    [retry, setRetry] = useState(0),
    [threeD, setThreeD] = useState(false)
  useEffect(() => {
    selectRef.current = onSelect
    boundsRef.current = onBounds
  })
  useEffect(() => {
    let disposed = false
    let listener: { remove(): void } | undefined
    let clickListener: { remove(): void } | undefined
    const container = element.current
    let timeout: ReturnType<typeof setTimeout>
    void loadMap()
      .then((sdk) => {
        if (disposed || !element.current) return
        const instance = new sdk.Map(element.current, {
          center: { lat: 16.068, lng: 108.201 },
          zoom: 12,
          controls: false,
        })
        map.current = instance
        setReady(true)
        listener = instance.addListener("idle", () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            try {
              boundsRef.current(mapBounds(instance))
            } catch {
              /* Bounds are unavailable until tiles are ready. */
            }
          }, 450)
        })
        clickListener = instance.addListener(
          "click",
          (event) => {
            const id = event?.marker?.getUserData()
            if (id) selectRef.current(id)
          },
          { marker: true }
        )
        setStatus("")
      })
      .catch((error) => {
        if (!disposed) setStatus(error.message)
      })
    return () => {
      disposed = true
      clearTimeout(timeout)
      listener?.remove()
      clickListener?.remove()
      map.current?.destroy?.()
      map.current = null
      container?.replaceChildren()
    }
  }, [retry])
  useEffect(() => {
    if (!ready || !map.current || !window.map4d) return
    const points: MarkerInstance[] = (routePath?.length ? [] : markers).map(
      (point) => {
        const button = document.createElement("button")
        button.className = "map-pin"
        button.title = point.name
        button.setAttribute("aria-label", point.name)
        const factory = point.categories.some((c) =>
          /sản xuất|vườn/i.test(c.name)
        )
        button.classList.toggle("green", factory)
        button.textContent = factory
          ? "♧"
          : point.categories.some((c) => /bán|showroom/i.test(c.name))
            ? "▣"
            : "✦"
        button.dataset.poiId = point.id
        const marker = new window.map4d!.Marker({
          position: { lat: point.lat, lng: point.lng },
          title: point.name,
          iconView: button.outerHTML,
          anchor: { x: 0.5, y: 1 },
          userInteractionEnabled: true,
        })
        marker.setUserData(point.id)
        marker.setMap(map.current)
        return marker
      }
    )
    return () => points.forEach((point) => point.setMap(null))
  }, [markers, ready, routePath?.length])
  useEffect(() => {
    element.current
      ?.querySelectorAll<HTMLElement>("[data-poi-id]")
      .forEach((pin) => {
        const active =
          pin.dataset.poiId === selected || pin.dataset.poiId === hovered
        pin.classList.toggle("selected", active)
        pin.style.zIndex = active ? "100" : ""
      })
  }, [selected, hovered, markers, ready])
  useEffect(() => {
    if (!ready || !map.current || !window.map4d || !location) return
    const dot = new window.map4d.Marker({
      position: location,
      iconView:
        navigating &&
        typeof locationHeading === "number" &&
        Number.isFinite(locationHeading)
          ? '<span class="navigation-gps-arrow" style="transform:rotate(' +
            locationHeading +
            'deg)" title="Vị trí hiện tại">▲</span>'
          : '<span class="gps-location-dot" title="Vị trí hiện tại"></span>',
      anchor: { x: 0.5, y: 0.5 },
    })
    dot.setMap(map.current)
    return () => dot.setMap(null)
  }, [location, ready, navigating, locationHeading])
  useEffect(() => {
    if (!ready || !map.current || !window.map4d || !routePath?.length) return
    const line = new window.map4d.Polyline({
      path: routePath,
      strokeColor: "#216747",
      strokeWidth: 6,
      strokeOpacity: 0.9,
    })
    line.setMap(map.current)
    const box = element.current?.getBoundingClientRect()
    if (box && !navigating)
      map.current.moveCamera(
        routeCamera(routePath, box.width, box.height, fullPage ? 0 : undefined)
      )
    const ends = [routePath[0], routePath[routePath.length - 1]].map(
      (point, i) => {
        const role = i === 0 ? "Điểm đi" : "Điểm đến"
        const name = (i === 0 ? routeOriginName : routeDestinationName) || role
        const root = document.createElement("div")
        root.className =
          "route-place-marker " + (i === 0 ? "is-origin" : "is-destination")
        root.title = role + ": " + name
        const dot = document.createElement("span")
        dot.className = "route-place-dot"
        dot.textContent = i === 0 ? "●" : "⚑"
        const label = document.createElement("div")
        label.className = "route-place-label"
        const heading = document.createElement("strong")
        heading.textContent = role
        const text = document.createElement("span")
        text.textContent = name
        label.append(heading, text)
        root.append(dot, label)
        const marker = new window.map4d!.Marker({
          position: point,
          title: role + ": " + name,
          iconView: root.outerHTML,
          anchor: { x: 0.5, y: 0.5 },
        })
        marker.setMap(map.current)
        return marker
      }
    )
    return () => {
      line.setMap(null)
      ends.forEach((marker) => marker.setMap(null))
    }
  }, [
    routePath,
    ready,
    fullPage,
    routeOriginName,
    routeDestinationName,
    navigating,
  ])
  useEffect(() => {
    if (!ready) return
    const point = selectedPoint || markers.find((m) => m.id === selected)
    if (point) {
      if (fullPage && !routePath)
        map.current?.moveCamera({ target: point, zoom: 16 })
      else if (!routePath) map.current?.panTo(point)
    }
  }, [selected, selectedPoint, markers, ready, fullPage, routePath])
  useEffect(() => {
    if (ready && location && (!navigating || following)) {
      const box = element.current?.getBoundingClientRect()
      const zoom = navigating ? 17 : 14
      const shift =
        navigating && box && box.width <= 700
          ? ((box.height * 0.25 * 360) / (256 * 2 ** zoom)) *
            Math.cos((location.lat * Math.PI) / 180)
          : 0
      map.current?.moveCamera({
        target: { lat: location.lat - shift, lng: location.lng },
        zoom,
      })
    }
  }, [location, ready, navigating, following])
  const zoom = (delta: number) => {
    if (navigating) onUserPan?.()
    if (map.current)
      map.current.moveCamera({
        zoom: Math.min(19, Math.max(5, map.current.getCamera().zoom + delta)),
      })
  }
  return (
    <div className="map-canvas">
      <div
        ref={element}
        className="map-sdk"
        onPointerDownCapture={(e) => {
          pointerOrigin.current = { x: e.clientX, y: e.clientY }
        }}
        onPointerMoveCapture={(e) => {
          const p = pointerOrigin.current
          if (
            navigating &&
            p &&
            (e.buttons || e.pointerType === "touch") &&
            Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8
          ) {
            onUserPan?.()
            pointerOrigin.current = null
          }
        }}
        onWheelCapture={() => {
          if (navigating) onUserPan?.()
        }}
        onPointerUpCapture={() => {
          pointerOrigin.current = null
        }}
        onPointerCancelCapture={() => {
          pointerOrigin.current = null
        }}
        aria-label="Bản đồ địa điểm OCOP Đà Nẵng"
      />
      {status && (
        <div className="map-status">
          <MapPinned size={36} />
          <h3>{ready ? "Bản đồ tạm gián đoạn" : "Bản đồ Đà Nẵng"}</h3>
          <p>{status}</p>
          {!status.startsWith("Đang") && (
            <button
              className="button secondary"
              onClick={() => {
                setStatus("Đang tải lại bản đồ…")
                setRetry((n) => n + 1)
              }}
            >
              <RefreshCw size={15} />
              Thử lại
            </button>
          )}
        </div>
      )}
      <div className="map-tag">
        <span className="live-dot" />
        Khám phá trên bản đồ
      </div>
      <div className="map-controls">
        <button title="Phóng to" onClick={() => zoom(1)}>
          <Plus size={19} />
        </button>
        <button title="Thu nhỏ" onClick={() => zoom(-1)}>
          <Minus size={19} />
        </button>
        <span />
        <button title="Vị trí của tôi" onClick={onLocate}>
          <LocateFixed size={19} />
        </button>
        <button
          className={threeD ? "active" : ""}
          title="Chuyển bản đồ 2D / 3D"
          onClick={() => {
            const next = !threeD
            map.current?.enable3dMode(next)
            setThreeD(next)
          }}
        >
          <Layers size={19} />
        </button>
      </div>
      <div className="map-legend">
        <span>
          <i className="orange" />
          Trải nghiệm
        </span>
        <span>
          <i className="green" />
          Sản xuất
        </span>
        <span>
          <i className="gold" />
          Điểm bán
        </span>
        <small>Map4D</small>
      </div>
    </div>
  )
}
