# Mora · Create & Connect

Mora là mạng xã hội sáng tạo của **Mour Studio**. Website tiếp tục dùng tài khoản, dữ liệu và repository `labmourstudio/Marea` đang hoạt động. Địa chỉ hiện tại là [labmourstudio.github.io/Marea](https://labmourstudio.github.io/Marea/); tên repository trong URL sẽ chỉ đổi sau khi cấu hình Supabase Auth cho địa chỉ mới.

Giao diện Mora dùng chữ có nét cổ điển và ngôi sao bốn cánh, với thanh điều hướng ngang trên desktop và thanh dưới màn hình điện thoại. **Khám phá dự án** đọc những dự án được chủ sở hữu công bố; **Không gian của tôi → Dự án cá nhân** cho phép tạo bản nháp, tự lưu trên thiết bị, chỉnh canvas nhân vật/vùng đất, sự kiện, phác thảo và xuất bản trình bày qua chức năng in PDF. Bản nháp này dùng IndexedDB của trình duyệt, có thể tải/nhập file JSON; không thể truy cập từ máy khác chỉ bằng đường liên kết. Không có bước tự đồng bộ hoặc công khai khi tạo bản nháp. Tính năng đồng bộ, chia sẻ dự án cho cộng tác viên, thông tin công khai được chọn và liên hệ từ dự án nằm trên nhánh phát triển, cần migration Supabase trước khi phát hành. Website không chèn người dùng, bài viết, dự án hoặc số liệu giả.

## Chạy ứng dụng

```bash
npm ci
cp .env.example .env.local
npm run dev
npm run lint
npm run build
```

Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` từ Supabase vào `.env.local`. Chỉ dùng publishable/anon key, không đưa service-role key vào trình duyệt hoặc GitHub. Nếu bắt đầu với database mới, chạy [`supabase/migrations/202609220001_initial_marea.sql`](supabase/migrations/202609220001_initial_marea.sql). Dự án Supabase cũ đã có schema này thì giữ nguyên dữ liệu.

## Đưa bản hiện tại lên GitHub Pages

Workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) triển khai khi `main` được cập nhật. Hai repository Actions secrets `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` cần chứa giá trị của dự án Supabase đang dùng. Base path được lấy từ tên repository GitHub, hiện là `/Marea/`. `404.html` xử lý truy cập trực tiếp đường dẫn trong ứng dụng.

Giữ `https://labmourstudio.github.io/Marea/**` trong Supabase **Authentication → URL Configuration** cho đến khi đổi URL. Để chuyển URL sang `/Mora/`, trước hết thêm `https://labmourstudio.github.io/Mora/**` vào Redirect URLs; sau đó đổi tên repository, kiểm tra Pages và đặt Site URL mới. Giữ redirect cũ trong giai đoạn chuyển tiếp để các email xác minh trước đó tiếp tục hoạt động. Đổi tên thương hiệu hiển thị không đòi hỏi đổi repository ngay.

## Quyền và giới hạn

- Supabase Auth, Postgres RLS và Storage kiểm tra quyền đối với dữ liệu. Nội dung riêng tư không xuất hiện trên Feed hay danh sách Projects công khai.
- Dự án chỉ lưu trên thiết bị hiện tại không được Supabase sao lưu hoặc bảo vệ bằng RLS. Người dùng cần xuất tệp JSON trước khi xóa dữ liệu trình duyệt hoặc đổi máy. Chỉ nội dung tạo riêng trên Supabase mới dùng các chính sách truy cập của Supabase.
- Mục Admin chỉ điều hướng cho vai trò được phép; RPC tại database kiểm tra lại các thao tác quản trị. GitHub Pages là hosting tĩnh, nên trang từ chối của client không phải HTTP 403 từ server.
- Giao diện hiện tại không đồng nghĩa với việc đã có MFA bắt buộc, phiên Admin ngắn hoặc cơ chế sao lưu. Xem [docs/SECURITY_AND_BACKEND.md](docs/SECURITY_AND_BACKEND.md).
- Dịch vụ GitHub Pages và các gói Supabase miễn phí có hạn mức theo nhà cung cấp; kiểm tra hạn mức tài khoản khi vận hành. Không có tính năng thu phí trong ứng dụng.

Trước khi giới thiệu thương hiệu Mora rộng rãi, kiểm tra quyền sử dụng tên, tên miền và tài khoản mạng xã hội.
