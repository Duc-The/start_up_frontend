import { Flag, LocateFixed, Navigation, Square, WifiOff } from "lucide-react"
import type { NavigationState } from "../services/NavigationSession"
import { readableDistance, readableDuration } from "../utils/navigationProgress"
import { travelModeLabels } from "@/features/directions/api/directionsApi"
export default function NavigationPanel({
  state,
  onStop,
  onRecenter,
  following,
  onUseGps,
}: {
  state: NavigationState
  onStop: () => void
  onRecenter: () => void
  onUseGps: () => void
  following: boolean
}) {
  const manual = state.status === "preview"
  const arrived = state.status === "arrived"
  return (
    <section className="live-navigation-panel" aria-label="Dẫn đường trực tiếp">
      <header>
        <div className="live-navigation-symbol">
          {arrived ? <Flag size={26} /> : <Navigation size={26} />}
        </div>
        <div>
          <span>
            {arrived
              ? "Hoàn thành hành trình"
              : manual
                ? "Điểm đi đã chọn"
                : "GPS trực tiếp"}
          </span>
          <h1>
            {state.status === "starting"
              ? "Đang chuẩn bị dẫn đường…"
              : arrived
                ? "Bạn đã đến nơi"
                : manual
                  ? "Lộ trình của bạn"
                  : "Đang dẫn đường"}
          </h1>
        </div>
      </header>
      <p className="navigation-destination">
        <Flag size={16} />
        {state.route?.destination?.name || "Đang lấy vị trí GPS của bạn"}
      </p>
      {manual && (
        <p className="navigation-origin">
          Điểm đi: <strong>{state.route?.origin?.name}</strong>
        </p>
      )}
      {state.status === "starting" ? (
        <div className="navigation-loading">
          <LocateFixed className="spin" size={24} />
          <p>Cho phép định vị để tìm đường từ vị trí hiện tại của bạn.</p>
        </div>
      ) : (
        <>
          <div className="navigation-instruction" role="status">
            <Navigation size={23} />
            <div>
              <strong>
                {state.recalculating
                  ? "Đang tìm lại đường…"
                  : state.nextInstruction || "Tiếp tục theo tuyến đường"}
              </strong>
              {!arrived && <span>{readableDistance(state.nextMeters)}</span>}
            </div>
          </div>
          <div className="navigation-metrics">
            <div>
              <strong>
                {arrived ? "Đã đến" : readableDuration(state.remainingSeconds)}
              </strong>
              <span>
                {arrived
                  ? "Hành trình hoàn tất"
                  : manual
                    ? "Thời gian dự kiến toàn tuyến"
                    : "Thời gian còn lại dự kiến"}
              </span>
            </div>
            <div>
              <strong>
                {arrived ? "0 m" : readableDistance(state.remainingMeters)}
              </strong>
              <span>{manual ? "Tổng quãng đường" : "Quãng đường còn lại"}</span>
            </div>
          </div>
          <p className="navigation-mode">
            {state.route?.travelMode
              ? travelModeLabels[state.route.travelMode]
              : ""}{" "}
            {manual
              ? " · Từ điểm đi đã chọn"
              : ` · GPS ±${Math.round(state.fix?.accuracy || 0)} m`}
          </p>
        </>
      )}
      {state.warning && (
        <p className="navigation-warning" role="status">
          <WifiOff size={17} />
          {state.warning}
        </p>
      )}
      {manual && (
        <>
          <p className="navigation-manual-note">
            Đang xem tuyến từ điểm đi đã chọn. Chọn dùng GPS nếu muốn vị trí cập
            nhật theo di chuyển thực tế.
          </p>
          <button
            className="button secondary navigation-recenter-panel"
            onClick={onUseGps}
          >
            <LocateFixed size={17} />
            Dùng vị trí của tôi
          </button>
        </>
      )}
      {!manual && !arrived && state.status !== "starting" && (
        <button
          className="button secondary navigation-recenter-panel"
          onClick={onRecenter}
        >
          <LocateFixed size={17} />
          {following ? "Đang bám theo vị trí của bạn" : "Về vị trí của tôi"}
        </button>
      )}
      <button className="button navigation-stop" onClick={onStop}>
        <Square size={16} />
        {arrived || manual ? "Kết thúc" : "Dừng dẫn đường"}
      </button>
    </section>
  )
}
