import { Input, Modal } from "antd"
import { CircleHelp, MessageSquareText } from "lucide-react"
import { toast } from "sonner"
const common = {
  centered: true,
  className: "mg-confirm-modal",
  okText: "Xác nhận",
  cancelText: "Hủy",
  okButtonProps: { style: { background: "#206641", borderColor: "#206641" } },
  width: 440,
}
export function confirmManagementAction(
  title: string,
  description: string,
  okText = "Xác nhận"
): Promise<boolean> {
  return new Promise((resolve) => {
    Modal.confirm({
      ...common,
      title,
      content: <p className="mg-confirm-description">{description}</p>,
      icon: <CircleHelp color="#397c51" size={24} />,
      okText,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
      afterClose: () => resolve(false),
    })
  })
}
export function requestManagementReason(title: string): Promise<string | null> {
  return new Promise((resolve) => {
    let value = ""
    Modal.confirm({
      ...common,
      title,
      icon: <MessageSquareText color="#397c51" size={24} />,
      content: (
        <label className="mg-reason-field">
          Lý do
          <Input.TextArea
            autoFocus
            rows={4}
            maxLength={2000}
            placeholder="Nhập lý do để người quản lý nội dung có thể điều chỉnh…"
            onChange={(event) => {
              value = event.target.value
            }}
          />
        </label>
      ),
      onOk: (close: () => void) => {
        if (!value.trim()) {
          toast.error("Vui lòng nhập lý do trước khi xác nhận")
          return
        }
        resolve(value.trim())
        close()
      },
      onCancel: () => resolve(null),
      afterClose: () => resolve(null),
    })
  })
}
