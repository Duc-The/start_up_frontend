import { toast } from "sonner"
import { decodePolyline } from "@/features/home/utils/searchScope"
import type { Route } from "@/features/directions/api/directionsApi"
import "@/assets/styles/discovery.css"
import { lazy, Suspense, useMemo, useState } from "react"

import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Compass,
  Footprints,
  Landmark,
  Leaf,
  LocateFixed,
  MapPin,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  Star,
  X,
  RefreshCw,
  List,
  Map as MapIcon,
  Navigation,
  History,
} from "lucide-react"

import FilterSidebar from "@/features/home/components/FilterSidebar"

import { PoiCard } from "@/features/home/components/PoiCard"

import { useHomePage } from "@/features/home/hooks/useHomePage"

import MainLayout from "@/layouts/MainLayout"

import HomeHeader from "@/features/home/components/HomeHeader"

const DirectionsPanel = lazy(
  () => import("@/features/directions/components/DirectionsPanel")
)
const MapView = lazy(() => import("@/features/home/components/MapView"))
const AuthDialog = lazy(() => import("@/features/auth/components/AuthDialog"))
const PoiDialog = lazy(() => import("@/features/pois/components/PoiDialog"))
const PersonalPanel = lazy(
  () => import("@/features/account/components/PersonalPanel")
)
export default function HomePage() {
  const workspace = useHomePage()
  const [route, setRoute] = useState<Route>()
  const routePath = useMemo(() => {
    try {
      return route?.overviewPolyline
        ? decodePolyline(route.overviewPolyline)
        : undefined
    } catch {
      return undefined
    }
  }, [route])
  const {
    hovered,
    setHovered,
    directions,
    setDirections,
    recent,
    clearRecent,
    searchViewport,
    displayKeyword,
    closeDetail,
    submitSearch,
    changeKeyword,
    searchRadius,
    selectedPoi,
    scopeError,
  } = workspace
  const selectedPoint = useMemo(
    () =>
      selectedPoi?.lat != null && selectedPoi.lng != null
        ? { lat: selectedPoi.lat, lng: selectedPoi.lng }
        : undefined,
    [selectedPoi]
  )
  const {
    user,
    applied,
    setApplied,
    draft,
    setDraft,
    keyword,
    setKeyword,
    focused,
    setFocused,
    sidebar,
    setSidebar,
    mobileList,
    setMobileList,
    auth,
    setAuth,
    personal,
    setPersonal,
    detail,
    selected,
    locating,
    position,
    debounced,
    options,
    places,
    markers,
    search,
    updateBounds,
    save,
    locate,
    select,
    reset,
    openGroup,
    remove,
    chips,
    selectedCount,
  } = workspace
  const mapMarkers = useMemo(() => {
    const points = markers.data?.items || []
    if (
      selectedPoi?.lat != null &&
      selectedPoi.lng != null &&
      !points.some((p) => p.id === selectedPoi.poi.id)
    )
      return [
        ...points,
        {
          id: selectedPoi.poi.id,
          name: selectedPoi.poi.name,
          lat: selectedPoi.lat,
          lng: selectedPoi.lng,
          categories: selectedPoi.poi.categories,
        },
      ]
    return points
  }, [markers.data, selectedPoi])
  return (
    <MainLayout>
      <HomeHeader workspace={workspace} />
      <section className="intro">
        <div className="intro-copy">
          <div className="eyebrow">
            <span />
            TỪ ĐỊA PHƯƠNG, ĐẾN TRÁI TIM
          </div>
          <h1>
            Chạm OCOP.
            <br className="mobile-only" /> <em>Khám phá Đà Nẵng.</em>
          </h1>
          <p>
            Gặp người làm thật. Chạm vào nghề truyền thống. Mang đặc sản về nhà.
          </p>
        </div>
        <div className="search-area">
          <div className="search-box">
            <Search size={21} />
            <input
              aria-label="Tìm sản phẩm hoặc địa điểm"
              placeholder="Tìm sản phẩm, điểm bán, trải nghiệm…"
              value={displayKeyword ?? keyword}
              onChange={(e) => {
                changeKeyword(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  void submitSearch().catch((e) => toast.error(e.message))
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 180)}
            />
            {keyword ? (
              <button
                className="icon-button"
                aria-label="Xóa tìm kiếm"
                onClick={() => {
                  closeDetail()
                  setKeyword("")
                }}
              >
                <X size={17} />
              </button>
            ) : (
              <kbd>Đà Nẵng</kbd>
            )}
            <button
              className="search-submit"
              title="Tìm kiếm"
              onClick={() =>
                void submitSearch().catch((e) => toast.error(e.message))
              }
            >
              <ArrowRight size={19} />
            </button>
            <button
              className="icon-button direction-toggle"
              title={detail || directions ? "Đóng" : "Chỉ đường"}
              aria-label={
                detail || directions
                  ? "Đóng địa điểm hoặc chỉ đường"
                  : "Mở chỉ đường"
              }
              onClick={() => {
                if (detail || directions) {
                  closeDetail()
                  setDirections(false)
                  setRoute(undefined)
                } else {
                  setDirections(true)
                  setFocused(false)
                }
              }}
            >
              {detail || directions ? (
                <X size={20} />
              ) : (
                <Navigation size={20} />
              )}
            </button>
          </div>
          {focused && !keyword && !detail && (
            <div className="search-suggestions recent-suggestions">
              <div className="recent-heading">
                <strong>Tìm kiếm gần đây</strong>
                {recent.length > 0 && (
                  <button onClick={() => clearRecent()}>Xóa hết</button>
                )}
              </div>
              {recent.length ? (
                recent.map((p) => (
                  <div className="recent-row" key={p.id}>
                    <button onClick={() => select(p.id, p.name)}>
                      <History size={16} />
                      {p.name}
                    </button>
                    <button
                      aria-label={"Xóa lịch sử " + p.name}
                      onClick={() => clearRecent(p.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p>Chưa có địa điểm đã xem.</p>
              )}
            </div>
          )}
          {focused && !detail && debounced.length >= 2 && (
            <div className="search-suggestions">
              {search.isPending ? (
                <p>Đang tìm kiếm…</p>
              ) : search.error ? (
                <p>Chưa tải được gợi ý.</p>
              ) : search.data?.length ? (
                search.data.map((s) => (
                  <button
                    key={s.type + s.id}
                    onClick={() => {
                      setFocused(false)
                      if (s.type === "POI") select(s.id, s.name)
                      else setKeyword(s.name)
                    }}
                  >
                    <span className="suggestion-icon">
                      {s.type === "POI" ? (
                        <MapPin size={17} />
                      ) : (
                        <ShoppingBasket size={17} />
                      )}
                    </span>
                    <span>
                      {s.name}
                      <small>
                        {s.type === "POI" ? "Địa điểm" : "Sản phẩm OCOP"}
                      </small>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                ))
              ) : (
                <p>Chưa tìm thấy gợi ý phù hợp.</p>
              )}
            </div>
          )}
          <div className="search-caption">
            <MapPin size={12} />
            Địa điểm, làng nghề và đặc sản tại Đà Nẵng
          </div>
        </div>
      </section>
      <div className="discovery-toolbar">
        <div className="quick-filters">
          <button
            className={
              "quick-filter near" + (applied.radiusMeters ? " active" : "")
            }
            disabled={locating}
            onClick={locate}
          >
            <LocateFixed size={16} />
            {locating ? "Đang định vị…" : "Gần tôi"}
          </button>
          <span className="toolbar-divider" />
          <button
            className="quick-filter"
            onClick={() => openGroup("productTypeIds")}
          >
            <ShoppingBasket size={17} />
            Nhóm sản phẩm
            <ChevronDown size={13} />
          </button>
          <button
            className="quick-filter"
            onClick={() => openGroup("categoryIds")}
          >
            <Landmark size={17} />
            Loại điểm
            <ChevronDown size={13} />
          </button>
          <button
            className="quick-filter"
            onClick={() => openGroup("activityIds")}
          >
            <Footprints size={17} />
            Bạn muốn làm gì?
            <ChevronDown size={13} />
          </button>
          <button
            className="quick-filter"
            onClick={() => openGroup("ocopStars")}
          >
            <Star size={17} className="gold" fill="currentColor" />
            Hạng OCOP
            <ChevronDown size={13} />
          </button>
        </div>
        <button className="filter-toggle" onClick={() => setSidebar(!sidebar)}>
          <SlidersHorizontal size={16} />
          Bộ lọc{selectedCount > 0 && <span>{selectedCount}</span>}
        </button>
      </div>
      <main className="discovery-layout">
        <FilterSidebar
          options={options.data}
          draft={draft}
          onDraft={setDraft}
          onApply={() => {
            setApplied({ ...draft, page: "0" })
            setSidebar(false)
          }}
          onReset={reset}
          open={sidebar}
          onClose={() => setSidebar(false)}
          busy={options.isPending}
        />
        <div className="discovery-main">
          <div className="results-toolbar">
            <div>
              <h2>Khám phá quanh bạn</h2>
              <span>
                {places.isPending
                  ? "Đang tìm địa điểm…"
                  : places.error
                    ? "Kết nối dữ liệu"
                    : places.data?.total.toLocaleString("vi-VN") +
                      " địa điểm đang chờ bạn"}
              </span>
            </div>
            <div className="results-actions">
              <select
                aria-label="Sắp xếp kết quả"
                value={applied.sort || "relevance"}
                onChange={(e) => {
                  if (e.target.value === "distance" && !position) {
                    locate()
                    return
                  }
                  setApplied((v) => ({ ...v, sort: e.target.value, page: "0" }))
                }}
              >
                <option value="relevance">Phù hợp nhất</option>
                <option value="rating">Đánh giá cao</option>
                <option value="distance">Gần nhất</option>
              </select>
            </div>
          </div>
          {(chips.length > 0 || applied.radiusMeters || keyword) && (
            <div className="active-filters">
              {keyword && (
                <button
                  onClick={() => {
                    closeDetail()
                    setKeyword("")
                  }}
                >
                  <Search size={12} />
                  {keyword}
                  <X size={12} />
                </button>
              )}
              {chips.map((chip) => (
                <button
                  key={chip.group + chip.id}
                  onClick={() => remove(chip.group, chip.id)}
                >
                  {chip.name}
                  <X size={12} />
                </button>
              ))}
              {applied.radiusMeters && (
                <button
                  onClick={() => {
                    const next = { ...applied }
                    delete next.radiusMeters
                    delete next.lat
                    delete next.lng
                    delete next.sort
                    setApplied(next)
                    setDraft(next)
                  }}
                >
                  Gần tôi · 10 km
                  <X size={12} />
                </button>
              )}
              <button className="clear-filters" onClick={reset}>
                Xóa tất cả
              </button>
            </div>
          )}
          {scopeError && (
            <p role="alert" className="search-scope-note">
              Chưa xác định được kết quả quanh bạn. Vui lòng thử lại.
            </p>
          )}
          <p className="search-scope-note">
            {searchRadius
              ? `Đang tìm trong bán kính ${searchRadius / 1000} km quanh bạn${searchRadius === 10000 ? " · Đã mở rộng vì có dưới 5 kết quả trong 2 km" : ""}`
              : "Địa điểm trong vùng tìm kiếm trên bản đồ"}
          </p>
          <div className={"explore-stage" + (mobileList ? " show-list" : "")}>
            <Suspense
              fallback={
                <div className="loading-block">Đang chuẩn bị bản đồ…</div>
              }
            >
              <MapView
                markers={mapMarkers}
                selected={selected}
                hovered={hovered}
                selectedPoint={selectedPoint}
                routePath={routePath}
                routeOriginName={route?.origin?.name}
                routeDestinationName={route?.destination?.name}
                onSelect={select}
                onBounds={updateBounds}
                onLocate={locate}
                location={position}
              />
            </Suspense>
            <button className="search-this-area" onClick={searchViewport}>
              <Search size={15} />
              Tìm trong khu vực này
            </button>
            <Suspense fallback={null}>
              {directions ? (
                <DirectionsPanel
                  key={detail || "blank"}
                  destination={selectedPoi}
                  position={position}
                  onLocate={locate}
                  onClose={() => {
                    setDirections(false)
                    setRoute(undefined)
                  }}
                  recent={recent}
                  onClearRecent={clearRecent}
                  onRoute={setRoute}
                />
              ) : (
                detail && (
                  <PoiDialog
                    key={detail}
                    id={detail}
                    inline
                    onClose={closeDetail}
                    onFavorite={save}
                    onDirections={() => {
                      setDirections(true)
                      setFocused(false)
                    }}
                  />
                )
              )}
            </Suspense>
            <section
              className={
                "results-panel" + (detail || directions ? " concealed" : "")
              }
              aria-label="Danh sách địa điểm"
            >
              <div className="panel-heading">
                <span>
                  <span className="live-dot" />
                  Địa điểm nổi bật
                </span>
                <small>
                  {places.isFetching ? (
                    <RefreshCw size={13} className="spin" />
                  ) : (
                    "ĐÀ NẴNG"
                  )}
                </small>
              </div>
              {places.isPending ? (
                <div className="skeleton-cards">
                  {[0, 1, 2].map((i) => (
                    <div className="skeleton-card" key={i} />
                  ))}
                </div>
              ) : places.error ? (
                <div className="empty-state">
                  <Compass size={34} />
                  <h3>Chưa kết nối được dữ liệu</h3>
                  <p>
                    {places.error.message || "Hãy kiểm tra backend và thử lại."}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      void places.refetch()
                      void options.refetch()
                      void markers.refetch()
                    }}
                  >
                    <RefreshCw size={14} />
                    Thử lại
                  </button>
                </div>
              ) : !places.data?.items.length ? (
                <div className="empty-state">
                  <Leaf size={36} />
                  <h3>Mỗi hành trình bắt đầu từ một điểm chạm</h3>
                  <p>
                    {selectedCount || keyword
                      ? "Chưa có địa điểm phù hợp. Hãy thử điều chỉnh bộ lọc."
                      : "Các địa điểm sẽ xuất hiện khi dữ liệu được cập nhật."}
                  </p>
                  <button className="button secondary" onClick={reset}>
                    Đặt lại bộ lọc
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <>
                  {places.data.items.map((p) => (
                    <PoiCard
                      key={p.id}
                      poi={p}
                      selected={p.id === selected}
                      onSelect={() => select(p.id, p.name)}
                      onHighlight={(active) =>
                        setHovered(active ? p.id : undefined)
                      }
                      onFavorite={() => save(p.id, p.favorite)}
                    />
                  ))}
                  {places.data.total > 20 && (
                    <div className="pagination">
                      <button
                        disabled={!Number(applied.page)}
                        onClick={() =>
                          setApplied((v) => ({
                            ...v,
                            page: String(Number(v.page || 0) - 1),
                          }))
                        }
                      >
                        Trước
                      </button>
                      <span>Trang {Number(applied.page || 0) + 1}</span>
                      <button
                        disabled={
                          (Number(applied.page || 0) + 1) * 20 >=
                          places.data.total
                        }
                        onClick={() =>
                          setApplied((v) => ({
                            ...v,
                            page: String(Number(v.page || 0) + 1),
                          }))
                        }
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </>
              )}
              <div className="local-note">
                <span className="local-note-icon">
                  <Leaf size={21} />
                </span>
                <div>
                  <strong>
                    Một lựa chọn nhỏ.
                    <br />
                    Một giá trị địa phương.
                  </strong>
                  <p>Cùng gìn giữ nghề, cùng nâng tầm OCOP.</p>
                </div>
                <ArrowUpRight size={18} />
              </div>
            </section>
            <button
              className="mobile-view-toggle"
              onClick={() => setMobileList(!mobileList)}
            >
              {mobileList ? <MapIcon size={17} /> : <List size={17} />}{" "}
              {mobileList ? "Xem bản đồ" : "Xem danh sách"}
            </button>
          </div>
          {markers.data && markers.data.total > 2000 && (
            <p className="map-limit">
              Đang hiện 2.000 ghim. Phóng to bản đồ để xem đầy đủ địa điểm trong
              vùng nhỏ hơn.
            </p>
          )}
        </div>
      </main>
      <footer className="site-footer">
        <span>
          OCOP GO<span className="footer-dot">·</span>Chạm vào giá trị địa
          phương
        </span>
        <span>
          <Leaf size={12} />
          Khám phá có trách nhiệm
        </span>
      </footer>
      <Suspense fallback={null}>
        {auth && <AuthDialog onClose={() => setAuth(false)} />}{" "}
        {personal && user && (
          <PersonalPanel
            key={personal}
            kind={personal}
            userId={user.id}
            onClose={() => setPersonal(null)}
            onSelect={select}
          />
        )}
      </Suspense>
    </MainLayout>
  )
}
