import { Bookmark, MapPin, Star, ArrowUpRight, Leaf } from "lucide-react"
import type { Poi } from "@/features/pois/types"
export function PoiCard({
  poi,
  selected,
  onSelect,
  onFavorite,
  onHighlight,
}: {
  poi: Poi
  selected?: boolean
  onSelect: () => void
  onFavorite: () => void
  onHighlight?: (active: boolean) => void
}) {
  return (
    <article
      className={"poi-card" + (selected ? " is-selected" : "")}
      onMouseEnter={() => onHighlight?.(true)}
      onMouseLeave={() => onHighlight?.(false)}
      onFocus={() => onHighlight?.(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onHighlight?.(false)
      }}
      onTouchStart={() => onHighlight?.(true)}
    >
      <button
        className="poi-photo"
        onClick={onSelect}
        aria-label={"Xem " + poi.name}
      >
        {poi.imageUrl ? (
          <img src={poi.imageUrl} alt={poi.name} loading="lazy" />
        ) : (
          <div className="photo-placeholder">
            <Leaf size={30} />
          </div>
        )}
        <span className="photo-type">
          {poi.categories[0]?.name || "Địa điểm OCOP"}
        </span>
      </button>
      <div className="poi-content">
        <div className="poi-title">
          <button onClick={onSelect}>
            <h3>{poi.name}</h3>
          </button>
          <button
            className={"save-button" + (poi.favorite ? " saved" : "")}
            title={poi.favorite ? "Bỏ yêu thích" : "Lưu yêu thích"}
            onClick={onFavorite}
          >
            <Bookmark size={19} fill={poi.favorite ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="poi-rating">
          <Star size={13} fill="currentColor" />
          <strong>
            {poi.ratingCount ? Number(poi.ratingAverage).toFixed(1) : "Mới"}
          </strong>
          <span>
            {poi.ratingCount
              ? "(" + poi.ratingCount + " đánh giá)"
              : "Chưa có đánh giá"}
          </span>
          {poi.distanceMeters != null && (
            <small>{(poi.distanceMeters / 1000).toFixed(1)} km</small>
          )}
        </div>
        <p className="poi-address">
          <MapPin size={13} />
          {poi.address}
        </p>
        <button className="poi-link" onClick={onSelect}>
          Khám phá địa điểm
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  )
}
