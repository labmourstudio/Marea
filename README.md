# Mora · Create & Connect

Mora là mạng xã hội sáng tạo của **Mour Studio**. Repository hiện có đã đổi tên thành [`labmourstudio/Mora`](https://github.com/labmourstudio/Mora); website dùng địa chỉ [labmourstudio.github.io/Mora](https://labmourstudio.github.io/Mora/). Tên Marea vẫn nằm trong tên migration ban đầu và đường dẫn cũ. Dự án giữ tài khoản và dữ liệu Supabase hiện có.

Giao diện Mora dùng chữ sans-serif rõ ràng, không có ngôi sao trong wordmark/favicon; thẻ giao diện vẫn là kính mờ. Điều hướng desktop ở trên, điện thoại ở dưới. **Khám phá dự án** đọc dự án đã công bố; **Không gian của tôi → Dự án của tôi** chứa cả cốt truyện, nhân vật, vùng đất và sự kiện trong cùng một dự án. Bản nháp tự lưu bằng IndexedDB, có thể tải/nhập JSON; liên kết không mở được bản chỉ lưu trên một thiết bị. Tính năng đồng bộ, chia sẻ dự án cho cộng tác viên và chọn nội dung công khai nằm trong [PR #2](https://github.com/labmourstudio/Mora/pull/2), cần migration và kiểm tra Supabase trước khi phát hành. Dữ liệu `worlds` cũ không bị xóa; chủ sở hữu có thể sao chép nội dung chữ, nhân vật và vùng đất sang một bản dự án riêng trên máy tại `/studio/projects`. Ảnh cũ vẫn ở bản gốc và phải được gắn lại bằng thao tác chủ động. Website không chèn tài khoản, bài, dự án hoặc số liệu hư cấu vào Supabase.

**Cập nhật 28/09/2026:** `/demo` minh họa Mabi cùng ba cộng sự hư cấu, quyền chỉnh sửa/xem, một dự án game gồm nhân vật/lore/kế hoạch, lựa chọn phần công khai dưới dạng portfolio hoặc lời mời trao đổi về đầu tư, bài tiến độ, khóa học và tương tác tại chỗ. Toàn bộ số người theo dõi và tình trạng kết bạn là số giả định **chỉ trong trang demo**; bấm thử không tạo kết bạn, lời mời hay bài đăng thật. Giao diện có chế độ sáng/tối và chọn ngôn ngữ lúc vào site (English mặc định; 11 ngôn ngữ mới dịch một phần). Feed ảnh/chủ đề có mã dùng schema hiện tại; bình chọn và video/âm thanh chờ migration [`202609270001_mora_social_posts.sql`](supabase/migrations/202609270001_mora_social_posts.sql), chưa xác nhận trên Supabase live. Xem [tài liệu bàn giao](docs/HANDOFF_MORA_2026-09-27.md) để phát triển tiếp.

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

Workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) triển khai khi `main` được cập nhật. Hai repository Actions secrets `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` cần chứa giá trị của dự án Supabase đang dùng. Base path được lấy từ tên repository GitHub, hiện là `/Mora/`. `404.html` xử lý truy cập trực tiếp đường dẫn trong ứng dụng.

**Việc đổi tên repository đã xảy ra trước khi xác nhận cài đặt Auth.** Trong Supabase **Authentication → URL Configuration**, cần thêm `https://labmourstudio.github.io/Mora/**` vào Redirect URLs và đặt Site URL thành `https://labmourstudio.github.io/Mora/`. Đã kiểm tra: đường dẫn Pages cũ `/Marea/login` trả về 404, nên các liên kết email cũ không tự chuyển tiếp chỉ nhờ giữ URL cũ trong danh sách Supabase; cần gửi lại email xác minh/đặt lại mật khẩu trên URL mới, hoặc triển khai redirect cũ riêng nếu muốn hỗ trợ chúng. Kiểm tra đăng ký qua email, đăng nhập và đặt lại mật khẩu trên đường dẫn mới. Mã nguồn không thể tự thay đổi cài đặt Auth của tài khoản Supabase.

## Quyền và giới hạn

- Supabase Auth, Postgres RLS và Storage kiểm tra quyền đối với dữ liệu. Nội dung riêng tư không xuất hiện trên Feed hay danh sách Projects công khai.
- Dự án chỉ lưu trên thiết bị hiện tại không được Supabase sao lưu hoặc bảo vệ bằng RLS. Người dùng cần xuất tệp JSON trước khi xóa dữ liệu trình duyệt hoặc đổi máy. Chỉ nội dung tạo riêng trên Supabase mới dùng các chính sách truy cập của Supabase.
- Mục Admin chỉ điều hướng cho vai trò được phép; RPC tại database kiểm tra lại các thao tác quản trị. GitHub Pages là hosting tĩnh, nên trang từ chối của client không phải HTTP 403 từ server.
- Giao diện hiện tại không đồng nghĩa với việc đã có MFA bắt buộc, phiên Admin ngắn hoặc cơ chế sao lưu. Xem [docs/SECURITY_AND_BACKEND.md](docs/SECURITY_AND_BACKEND.md).
- Dịch vụ GitHub Pages và các gói Supabase miễn phí có hạn mức theo nhà cung cấp; kiểm tra hạn mức tài khoản khi vận hành. Không có tính năng thu phí trong ứng dụng.

Trước khi giới thiệu thương hiệu Mora rộng rãi, kiểm tra quyền sử dụng tên, tên miền và tài khoản mạng xã hội.
