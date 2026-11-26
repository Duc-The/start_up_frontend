import { Bookmark, Bell, CheckCheck } from "lucide-react"

import { Modal } from "@/components/common/Modal"

import { PoiCard } from "@/features/home/components/PoiCard"

import { usePersonalPanel } from "../hooks/usePersonalPanel"

export default function PersonalPanel({
  kind,
  userId,
  onClose,
  onSelect,
}: {
  kind: "favorites" | "notifications"
  userId: string
  onClose: () => void
  onSelect: (id: string) => void
}) {
  const {
    page,
    setPage,
    unread,
    setUnread,
    favorites,
    notices,
    mutation,
    current,
    follow,
  } = usePersonalPanel({ kind, userId, onClose, onSelect })
  return (
    <Modal
      title={kind === "favorites" ? "Địa điểm đã lưu" : "Thông báo của bạn"}
      sheet
      onClose={onClose}
    >
      {kind === "notifications" && (
        <div className="notice-toolbar">
          <label>
            <input
              type="checkbox"
              checked={unread}
              onChange={(e) => {
                setUnread(e.target.checked)
                setPage(0)
              }}
            />
            Chỉ hiện chưa đọc
          </label>
          <button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                path: "/me/notifications/read-all",
                method: "PATCH",
              })
            }
          >
            <CheckCheck size={16} />
            Đọc tất cả
          </button>
        </div>
      )}
      {current.isPending ? (
        <div className="loading-block">Đang tải…</div>
      ) : current.error ? (
        <div className="empty-state">
          <p>{current.error.message}</p>
          <button
            className="button secondary"
            onClick={() => void current.refetch()}
          >
            Thử lại
          </button>
        </div>
      ) : !current.data?.items.length ? (
        <div className="empty-state">
          {kind === "favorites" ? <Bookmark size={36} /> : <Bell size={36} />}
          <h3>
            {kind === "favorites"
              ? "Chưa có địa điểm đã lưu"
              : "Bạn đã xem hết thông báo"}
          </h3>
          <p>
            {kind === "favorites"
              ? "Lưu những điểm đến thú vị để tìm lại dễ dàng."
              : "Những cập nhật mới sẽ xuất hiện ở đây."}
          </p>
        </div>
      ) : kind === "favorites" ? (
        <div className="personal-cards">
          {favorites.data?.items.map((p) => (
            <PoiCard
              key={p.id}
              poi={p}
              onSelect={() => onSelect(p.id)}
              onFavorite={() =>
                mutation.mutate({
                  path: "/me/favorite-pois/" + p.id,
                  method: "DELETE",
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="notice-list">
          {notices.data?.items.map((n) => (
            <button
              key={n.id}
              className={"notice" + (!n.read ? " unread" : "")}
              onClick={() => follow(n)}
            >
              <i />
              <div>
                <strong>{n.title}</strong>
                <p>{n.content}</p>
                <small>{new Date(n.createdAt).toLocaleString("vi-VN")}</small>
              </div>
            </button>
          ))}
        </div>
      )}
      {!!current.data && current.data.total > 10 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage((n) => n - 1)}>
            Trước
          </button>
          <span>Trang {page + 1}</span>
          <button
            disabled={(page + 1) * 10 >= current.data.total}
            onClick={() => setPage((n) => n + 1)}
          >
            Sau
          </button>
        </div>
      )}
    </Modal>
  )
}
