# Mora · Create & Connect

Mora là mạng xã hội sáng tạo của **Mour Studio**. Repository hiện có đã đổi tên thành [`labmourstudio/Mora`](https://github.com/labmourstudio/Mora); website dùng địa chỉ [labmourstudio.github.io/Mora](https://labmourstudio.github.io/Mora/). Tên Marea vẫn nằm trong tên migration ban đầu và đường dẫn cũ. Dự án giữ tài khoản và dữ liệu Supabase hiện có.

Giao diện Mora dùng chữ sans-serif rõ ràng, không có ngôi sao trong wordmark/favicon; thẻ giao diện vẫn là kính mờ. Điều hướng desktop ở trên, điện thoại ở dưới. **Khám phá dự án** đọc dự án đã công bố; **Không gian của tôi → Dự án của tôi** chứa cả cốt truyện, nhân vật, vùng đất và sự kiện trong cùng một dự án. Bản nháp tự lưu bằng IndexedDB, có thể tải/nhập JSON; liên kết không mở được bản chỉ lưu trên một thiết bị. Tính năng đồng bộ, chia sẻ dự án cho cộng tác viên và chọn nội dung công khai nằm trong [PR #2](https://github.com/labmourstudio/Mora/pull/2), cần migration và kiểm tra Supabase trước khi phát hành. Dữ liệu `worlds` cũ không bị xóa; chủ sở hữu có thể sao chép nội dung chữ, nhân vật và vùng đất sang một bản dự án riêng trên máy tại `/studio/projects`. Ảnh cũ vẫn ở bản gốc và phải được gắn lại bằng thao tác chủ động. Website không chèn tài khoản, bài, dự án hoặc số liệu hư cấu vào Supabase.

**Cập nhật 28/09/2026:** Người dùng chọn **Truyện**, **Game Design** hoặc **Sự kiện Game** ngay khi tạo dự án trên thiết bị. Truyện có lore, cốt truyện, nhân vật, địa điểm và mốc truyện. Game có tướng, gameplay, kỹ năng, vật phẩm, tiền tệ, dòng skin, sự kiện và bảng quan hệ/chi phí. Dự án sự kiện có thể chọn tướng và tiền tệ từ **game gốc cùng tài khoản trên cùng thiết bị**; game gốc hiển thị dòng skin, giá trong game và dự toán của sự kiện sau khi bản nháp được lưu. Đây là tham chiếu giữa các bản nháp trên máy, **chưa cấp quyền cộng tác giữa hai tài khoản hoặc đồng bộ lên server**. Đã đọc Legacy of Mour để hiểu cách tổ chức game; không thay đổi repository đó và không tự nhập dữ liệu của nó vào Mora.

**Cập nhật 29/09/2026:** Trang Khám phá dự án có dải thể loại lướt ngang, bộ lọc bạn bè/người theo dõi/hoạt động/tìm vốn và thẻ dự án có ảnh bìa dọc 3:4. Dữ liệu và thứ tự dựa trên các dự án, bài liên kết và kết nối thật đang công khai; mục gọi vốn thành công chờ quy trình xác minh. Trình biên tập dự án có mục lục bên trái và thanh công cụ trên cùng, bảng ý tưởng kéo thả, sơ đồ quan hệ, ảnh bìa 3:4 và hồ sơ nhân vật 3:4 → 16:9 với flashart. Những thay đổi này **tự lưu trong IndexedDB của thiết bị**. Đường dẫn `/projects/:projectId` hiển thị thông tin cơ bản của dự án đã xuất bản; nội dung từng mục chỉ hiển thị khi `project_showcases` và `public_snapshot` của [PR #2](https://github.com/labmourstudio/Mora/pull/2) được triển khai và kiểm tra. Bản nháp riêng không được trình bày như dự án công khai.

Các hồ sơ Mabi cùng ba cộng sự hư cấu, bài viết, dự án Morimori và khóa học chỉ xuất hiện trong khu vực kịch bản mẫu `/community` và những thẻ mẫu vẫn được gắn nhãn ở Feed/Learn. Trang Bạn bè và Khám phá dự án chỉ hiển thị dữ liệu thật. Tương tác mẫu chỉ thay đổi bộ nhớ giao diện, không tạo người dùng, kết bạn, dự án hoặc lượt theo dõi trong Supabase. Giao diện có chế độ sáng/tối và chọn ngôn ngữ lúc vào site (English mặc định; 11 ngôn ngữ mới dịch một phần). Feed ảnh/chủ đề có mã dùng schema hiện tại; bình chọn và video/âm thanh thật chờ migration [`202609270001_mora_social_posts.sql`](supabase/migrations/202609270001_mora_social_posts.sql), chưa xác nhận trên Supabase live. Xem [tài liệu bàn giao](docs/HANDOFF_MORA_2026-09-27.md) để phát triển tiếp.

**Bố cục gọn 29/09/2026:** Trang tạo dự án mở thẳng lựa chọn Truyện, Game, Phim ảnh, Sự kiện game và form đặt tên; bản nháp nằm ở khung cuộn tiếp theo. Khám phá dự án mở ngay dải thể loại có biểu tượng và danh sách công khai, không có banner giới thiệu. Bạn bè mở ngay danh sách kết nối; nút Nhóm chỉ tải những nhóm dự án công khai đã lưu trên thiết bị hoặc đã tham gia. Lời mời nhóm riêng tư và đồng bộ danh sách đã lưu giữa các thiết bị **chưa hoạt động** vì schema/migration tương ứng chưa có trên Supabase. Header không đè lên nội dung khi cuộn ở những trang này; trên màn hình nhỏ nội dung tự dồn hàng để không bị cắt.

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

## Bản rà soát 03/10/2026

Xem [danh sách tính năng, lỗi đã sửa, migration và việc còn lại](docs/MORA_RELEASE_AUDIT_2026-10-03.md). Bản nháp cloud/cộng tác và MFA quản trị cần các migration trong tài liệu; frontend kiểm tra capability trước khi bật. Không coi schema trong git là schema đã áp dụng trên Supabase.
