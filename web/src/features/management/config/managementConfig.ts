import {
  Leaf,
  LayoutDashboard,
  MapPin,
  Package,
  Store,
  Award,
  Route,
  BookOpen,
  CalendarDays,
  Images,
  Users,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  ListTree,
} from "lucide-react"

import "@/assets/styles/management.css"
export type Nav = {
  key: string
  label: string
  icon: typeof Leaf
  admin?: boolean
}
export type NavigationGroup = {
  key: string
  label: string
  icon: typeof Leaf
  children: Nav[]
}
export type NavigationEntry = Nav | NavigationGroup
export const navigationTree: NavigationEntry[] = [
  { key: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  {
    key: "discovery",
    label: "Khám phá & du lịch",
    icon: MapPin,
    children: [
      { key: "pois", label: "Địa điểm", icon: MapPin },
      { key: "tours", label: "Tour & hành trình", icon: Route },
      { key: "events", label: "Sự kiện", icon: CalendarDays },
      { key: "stories", label: "Câu chuyện OCOP", icon: BookOpen },
    ],
  },
  {
    key: "commerce",
    label: "Sản phẩm & bán hàng",
    icon: ShoppingBag,
    children: [
      { key: "products", label: "Sản phẩm", icon: Package },
      { key: "listings", label: "Điểm bán & tồn kho", icon: Store },
      { key: "certifications", label: "Chứng nhận", icon: Award },
      { key: "orders", label: "Đơn hàng", icon: ShoppingBag },
      { key: "payments", label: "Thanh toán", icon: CreditCard, admin: true },
    ],
  },
  {
    key: "reviews",
    label: "Đánh giá",
    icon: MessageSquare,
    children: [
      { key: "reviews/poi", label: "Đánh giá địa điểm", icon: MapPin },
      { key: "reviews/product", label: "Đánh giá sản phẩm", icon: Package },
    ],
  },
  { key: "media", label: "Thư viện tài nguyên", icon: Images },
  {
    key: "catalogs",
    label: "Danh mục",
    icon: ListTree,
    children: [
      { key: "catalogs/product-types", label: "Nhóm sản phẩm", icon: ListTree },
      { key: "catalogs/areas", label: "Khu vực", icon: MapPin },
      {
        key: "catalogs/poi-categories",
        label: "Loại địa điểm",
        icon: ListTree,
      },
      { key: "catalogs/activities", label: "Hoạt động", icon: Route },
      { key: "catalogs/amenities", label: "Tiện ích", icon: Store },
    ],
  },
  {
    key: "administration",
    label: "Quản lý hệ thống",
    icon: Users,
    children: [
      { key: "businesses", label: "Cơ sở & đối tác", icon: Store },
      { key: "users", label: "Tài khoản", icon: Users, admin: true },
      { key: "audits", label: "Lịch sử thay đổi", icon: BookOpen, admin: true },
    ],
  },
]
// A derived leaf index keeps page titles and existing dashboard shortcuts consistent.
export const navigation: Nav[] = navigationTree.flatMap((entry) =>
  "children" in entry ? entry.children : [entry]
)
export const words: Record<string, string> = {
  businessId: "Cơ sở sở hữu",
  areaId: "Khu vực",
  name: "Tên",
  address: "Địa chỉ",
  lat: "Vĩ độ",
  lng: "Kinh độ",
  openingHours: "Giờ mở cửa",
  categoryIds: "Loại địa điểm",
  activityIds: "Hoạt động",
  amenityIds: "Tiện ích",
  manufacturerPoiId: "Địa điểm sản xuất",
  productTypeId: "Nhóm sản phẩm",
  description: "Mô tả",
  poiId: "Địa điểm",
  productId: "Sản phẩm",
  priceVnd: "Giá bán (đ)",
  stockQuantity: "Số lượng tồn kho",
  active: "Đang hoạt động",
  type: "Loại chứng nhận",
  ocopStars: "Số sao OCOP",
  certificateNumber: "Số chứng nhận",
  issuingAuthority: "Đơn vị cấp",
  issuedOn: "Ngày cấp",
  expiresOn: "Ngày hết hạn",
  introduction: "Giới thiệu",
  founder: "Người sáng lập",
  foundedYear: "Năm thành lập",
  slug: "Đường dẫn ngắn",
  sections: "Các phần câu chuyện",
  startsAt: "Bắt đầu",
  endsAt: "Kết thúc",
  organizer: "Đơn vị tổ chức",
  registrationUrl: "Đường dẫn đăng ký",
  recurrence: "Lịch lặp",
  representative: "Người đại diện",
  phone: "Điện thoại",
  email: "Email",
  website: "Website",
  socialLinks: "Liên kết mạng xã hội",
  iconUrl: "Biểu tượng",
  colorHex: "Màu biểu tượng",
  sortOrder: "Thứ tự",
  parentId: "Danh mục cha",
  code: "Mã danh mục",
}
export const statuses: Record<string, string> = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Cần chỉnh sửa",
  ARCHIVED: "Đã lưu trữ",
  ACTIVE: "Hoạt động",
  UNACTIVE: "Đã khóa",
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  SHIPPED: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  READY: "Sẵn sàng",
  PENDING: "Đang xử lý",
  HIDDEN: "Đã ẩn",
}
export const contentTypes = [
  "pois",
  "products",
  "certifications",
  "stories",
  "events",
  "tours",
]
export const base = "/management/"

export const MANAGEMENT_PAGE_SIZE = 12
