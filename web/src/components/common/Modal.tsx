import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { X } from "lucide-react"
interface Props {
  children: ReactNode
  title: string
  onClose: () => void
  wide?: boolean
  sheet?: boolean
}
export function Modal({
  children,
  title,
  onClose,
  wide = false,
  sheet = false,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    el?.showModal()
    document.body.style.overflow = "hidden"
    return () => {
      el?.close()
      document.body.style.overflow = ""
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={"modal " + (wide ? "wide " : "") + (sheet ? "sheet" : "")}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
