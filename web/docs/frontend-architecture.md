# Cấu trúc frontend OCOP GO

Dự án dùng React + TypeScript + Vite. Luồng chính đi từ routes → pages → layouts/features → feature API → services/httpClient → Axios instance.

- `assets/styles`: CSS toàn cục và quản lý, tài nguyên import qua bundler.
- `components/ui`: shadcn/ui hiện có (bản Base UI). `components/common`: Modal và theme provider dùng chung.
- `features/auth`, `home`, `pois`, `account`, `management`: tổ chức nghiệp vụ theo api/components/hooks/types; config/data/utils nằm trong feature khi chỉ dùng tại đó.
- `hooks`: useDebounce và Redux hooks dùng chung.
- `layouts`: MainLayout, AuthLayout, DashboardLayout.
- `lib`: cấu hình Axios, QueryClient, Ant Design theme, Map4D SDK.
- `pages`: HomePage và ManagementPage ghép giao diện/tính năng.
- `routes`: React Router Routes và ProtectedRoute. /admin yêu cầu ADMIN, /partner và /management cho PARTNER/ADMIN.
- `services`: HTTP, interceptor và phối hợp phiên đăng nhập dùng chung.
- `stores`: Redux Toolkit quản lý UI; authStore giữ access token trong bộ nhớ, refresh token và hồ sơ theo sessionStorage hiện có. Không đưa API cache vào Redux.
- `types`: ApiResponse/PageData dùng chung; kiểu nghiệp vụ thuộc feature tương ứng.
- `utils`: hàm thuần như cn, queryParams và flatten options.
- `App.tsx`: gắn cấu hình route. `main.tsx`: Provider Redux, TanStack Query và BrowserRouter.

React Hook Form và Zod đã áp dụng cho đăng nhập/đăng ký; schema và logic submit nằm ngoài component. Ant Design dùng cho bảng quản lý, cùng theme xanh OCOP và locale tiếng Việt. Các form nghiệp vụ quản lý hiện vẫn dùng Field riêng, có thể chuyển từng form sang schema theo nghiệp vụ khi mở rộng.

Axios request interceptor gắn access token. Response interceptor chỉ retry một lần sau 401, dùng chung một promise refresh cho các request đồng thời. Refresh dùng instance riêng, không tự gọi lại interceptor. Refresh thất bại thu hồi phiên; kết quả refresh không khôi phục một phiên đã bị đăng xuất trong lúc chờ.

TanStack Query quản lý loading/cache/retry và invalidation. Trang home và quản lý tải theo route; các nhóm Ant Design và rc-components được tách chunk. Không sao chép cache API sang Redux.

Chạy `npm run dev`, `npm run build`, `npm run lint`, `npm run test`. Bộ test kiểm tra concurrent refresh, giới hạn retry, đăng xuất khi đang refresh và schema đăng nhập/đăng ký. Các thư viện có thể cập nhật bằng package.json/package-lock.json; không sửa node_modules bằng tay.
