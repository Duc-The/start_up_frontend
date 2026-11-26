import type { ReactNode } from "react"
import { toast } from "sonner"
import {
  MapPin,
  Clock,
  Star,
  Leaf,
  ExternalLink,
  Navigation,
  Bookmark,
  Share2,
  X,
} from "lucide-react"

import { Modal } from "@/components/common/Modal"

import { usePoiDetail } from "../hooks/usePoiDetail"

export default function PoiDialog({
  id,
  onClose,
  inline = false,
  pageView = false,
  onDirections,
  onFavorite,
}: {
  id: string
  onClose: () => void
  pageView?: boolean
  inline?: boolean
  onDirections?: () => void
  onFavorite?: (id: string, saved: boolean) => void
}) {
  const {
    tab,
    setTab,
    detail,
    page,
    setPage,
    products,
    reviews,
    data,
    active,
  } = usePoiDetail(id)
  const Container = pageView ? PageContent : inline ? DetailPane : Modal
  return (
    <Container
      title={data?.poi.name || "Khám phá địa điểm"}
      wide
      onClose={onClose}
    >
      {detail.isPending ? (
        <div className="loading-block">Đang tải địa điểm…</div>
      ) : detail.error ? (
        <div className="empty-state">
          <p>{detail.error.message}</p>
          <button
            className="button secondary"
            onClick={() => void detail.refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : (
        data && (
          <>
            <div className="detail-hero">
              {data.poi.imageUrl ? (
                <img
                  src={data.poi.imageUrl}
                  alt={data.poi.name}
                  onLoad={(e) => {
                    const img = e.currentTarget
                    img.dataset.compact = String(
                      img.naturalWidth < 500 ||
                        img.naturalWidth / img.naturalHeight < 0.9
                    )
                  }}
                />
              ) : (
                <Leaf size={48} />
              )}
              <span>{data.poi.categories.map((c) => c.name).join(" · ")}</span>
            </div>
            {pageView && (
              <div className="map-place-heading">
                <h1>{data.poi.name}</h1>
                <div>
                  <Star size={15} fill="currentColor" />
                  <strong>
                    {data.poi.ratingCount
                      ? Number(data.poi.ratingAverage).toFixed(1)
                      : "Chưa có đánh giá"}
                  </strong>
                  {data.poi.ratingCount > 0 && (
                    <span>({data.poi.ratingCount} đánh giá)</span>
                  )}
                </div>
                <p>
                  {data.poi.categories.map((c) => c.name).join(" · ") ||
                    "Địa điểm OCOP"}
                </p>
              </div>
            )}
            <div className="detail-summary">
              <p>
                <MapPin size={16} />
                {data.poi.address}
              </p>
              <p>
                <Star size={16} className="gold" fill="currentColor" />
                {data.poi.ratingCount
                  ? data.poi.ratingAverage +
                    " / 5 · " +
                    data.poi.ratingCount +
                    " đánh giá"
                  : "Chưa có đánh giá"}
              </p>
            </div>
            <div className="place-actions">
              {onDirections && (
                <button className="button primary" onClick={onDirections}>
                  <Navigation size={16} />
                  Chỉ đường
                </button>
              )}
              {onFavorite && (
                <button
                  className="button secondary"
                  onClick={() => onFavorite(id, data.poi.favorite)}
                >
                  <Bookmark
                    size={16}
                    fill={data.poi.favorite ? "currentColor" : "none"}
                  />
                  {data.poi.favorite ? "Đã lưu" : "Lưu địa điểm"}
                </button>
              )}
              <button
                className="button secondary"
                onClick={() => {
                  const url = new URL("/places/" + id, location.origin)
                  void navigator.clipboard
                    .writeText(url.toString())
                    .then(() => toast.success("Đã sao chép liên kết địa điểm"))
                    .catch(() =>
                      toast.error(
                        "Chưa sao chép được liên kết. Hãy sao chép địa chỉ trên thanh trình duyệt."
                      )
                    )
                }}
              >
                <Share2 size={16} />
                Chia sẻ
              </button>
            </div>
            <div className="detail-tabs">
              {["Thông tin", "Sản phẩm", "Đánh giá"].map((name) => (
                <button
                  key={name}
                  className={tab === name ? "active" : ""}
                  onClick={() => {
                    setTab(name)
                    setPage(0)
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            {tab === "Thông tin" ? (
              <div className="detail-info">
                <div>
                  <h3>
                    <Clock size={17} />
                    Giờ mở cửa
                  </h3>
                  {Object.keys(data.openingHours).length ? (
                    Object.entries(data.openingHours).map(([day, periods]) => (
                      <p className="hours-row" key={day}>
                        <span>
                          {(
                            {
                              monday: "Thứ Hai",
                              tuesday: "Thứ Ba",
                              wednesday: "Thứ Tư",
                              thursday: "Thứ Năm",
                              friday: "Thứ Sáu",
                              saturday: "Thứ Bảy",
                              sunday: "Chủ nhật",
                            } as Record<string, string>
                          )[day] || day}
                        </span>
                        <strong>
                          {periods.length
                            ? periods
                                .map((p) => p.open + " – " + p.close)
                                .join(", ")
                            : "Đóng cửa"}
                        </strong>
                      </p>
                    ))
                  ) : (
                    <p className="muted">Đang cập nhật giờ mở cửa.</p>
                  )}
                  <h3>Trải nghiệm tại đây</h3>
                  <div className="info-tags">
                    {data.activities.map((a) => (
                      <span key={a.id}>{a.name}</span>
                    ))}
                  </div>
                  <h3>Tiện ích</h3>
                  <div className="info-tags">
                    {data.amenities.map((a) => (
                      <span key={a.id}>{a.name}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Hình ảnh & video</h3>
                  <div className="media-gallery">
                    {data.media.map((m) =>
                      m.type === "IMAGE" ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          key={m.id}
                        >
                          <img src={m.url} alt={data.poi.name} loading="lazy" />
                        </a>
                      ) : (
                        <video key={m.id} controls preload="none" src={m.url} />
                      )
                    )}
                  </div>
                  {data.lat != null && data.lng != null && (
                    <a
                      className="button secondary directions"
                      href={
                        "https://map.map4d.vn/?lat=" +
                        data.lat +
                        "&lng=" +
                        data.lng
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Mở vị trí trên Map4D
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="detail-results">
                {active.isPending ? (
                  <p className="loading-block">Đang tải…</p>
                ) : active.error ? (
                  <div className="empty-inline">
                    <p>{active.error.message}</p>
                    <button onClick={() => void active.refetch()}>
                      Thử lại
                    </button>
                  </div>
                ) : tab === "Sản phẩm" ? (
                  <div className="product-grid">
                    {products.data?.items.map((p) => (
                      <article key={p.listingId}>
                        <div className="product-image">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} loading="lazy" />
                          ) : (
                            <Leaf />
                          )}
                        </div>
                        <h3>{p.name}</h3>
                        <strong>{p.priceVnd.toLocaleString("vi-VN")} ₫</strong>
                        <p className="muted">
                          {p.stockQuantity > 0 ? "Còn hàng" : "Tạm hết hàng"}
                        </p>
                        {p.certifications
                          .filter((c) => c.ocopStars)
                          .map((c, i) => (
                            <small className="gold" key={i}>
                              OCOP {"★".repeat(c.ocopStars!)}
                            </small>
                          ))}
                      </article>
                    ))}
                    {!products.data?.items.length && (
                      <p className="empty-inline">
                        Chưa có sản phẩm đang bán tại điểm này.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="reviews-list">
                    {reviews.data?.items.map((review) => (
                      <article key={review.id}>
                        <div className="review-header">
                          <strong>{review.displayName}</strong>
                          <span className="gold">
                            {"★".repeat(review.rating)}
                          </span>
                          <small>
                            {new Date(review.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </small>
                        </div>
                        <p>{review.comment}</p>
                        <div className="review-media">
                          {review.media.map((m) =>
                            m.type === "IMAGE" ? (
                              <a
                                href={m.url}
                                key={m.id}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={m.url}
                                  alt="Ảnh đánh giá"
                                  loading="lazy"
                                />
                              </a>
                            ) : (
                              <video
                                key={m.id}
                                src={m.url}
                                controls
                                preload="none"
                              />
                            )
                          )}
                        </div>
                      </article>
                    ))}
                    {!reviews.data?.items.length && (
                      <p className="empty-inline">Địa điểm chưa có đánh giá.</p>
                    )}
                  </div>
                )}
                {active.data && active.data.total > 8 && (
                  <div className="pagination">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((n) => n - 1)}
                    >
                      Trước
                    </button>
                    <span>Trang {page + 1}</span>
                    <button
                      disabled={(page + 1) * 8 >= active.data.total}
                      onClick={() => setPage((n) => n + 1)}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )
      )}
    </Container>
  )
}

function DetailPane({
  children,
  title,
  onClose,
}: {
  children: ReactNode
  title: string
  onClose: () => void
  wide?: boolean
}) {
  return (
    <aside className="place-detail-panel" aria-label={"Chi tiết " + title}>
      <header>
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Đóng chi tiết"
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </aside>
  )
}

function PageContent({
  children,
}: {
  children: ReactNode
  title: string
  wide?: boolean
  onClose: () => void
}) {
  return <div className="map-place-content">{children}</div>
}
