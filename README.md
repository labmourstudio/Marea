# Mora · Create & Connect

Mora là mạng xã hội sáng tạo của **Mour Studio**. Trang đang hoạt động ở `https://labmourstudio.github.io/Marea/` đã có thanh điều hướng ngang, giao diện kính mờ và công cụ dự án lưu trên thiết bị. Nhánh phát triển này bổ sung phần đồng bộ và cộng tác trên Supabase; không xóa người dùng hay dữ liệu thật và không chèn nội dung mẫu vào sản phẩm.

## Phần tiếp tục sử dụng và phần xây thêm

| Có sẵn từ Marea | Bổ sung cho Mora |
| --- | --- |
| React, Vite, GitHub Pages, Supabase Auth và RLS | Nhận diện chữ Mora và ngôi sao bốn cánh |
| Feed, Friends, Worlds, Learn, Profile, Studio, Admin | Feed dùng bucket ảnh/video riêng, không tự tạo project |
| Bảng `projects`, `project_members` và quyền sở hữu | Bản giới thiệu công khai tách khỏi không gian dự án riêng |
| Tài khoản, khóa học, nội dung và quyền truy cập hiện có | Bản nháp trong IndexedDB, canvas, sự kiện, lời mời và trình bày PDF |

## Cài đặt và phát triển

```bash
npm ci
cp .env.example .env.local
npm run dev
npm run lint
npm run build
```

Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` từ Supabase. Chỉ dùng **publishable/anon key**; không đưa service-role key vào Vite, GitHub hoặc trình duyệt. Không có biến môi trường, ứng dụng hiển thị thông báo cấu hình thay vì giả lập đăng nhập hoặc dữ liệu.

## Cơ sở dữ liệu

1. Dự án mới: áp dụng `supabase/migrations/202609220001_initial_marea.sql`, sau đó `supabase/migrations/202609260001_mora_project_space.sql` trong SQL Editor của Supabase. Dự án Marea đang chạy chỉ cần migration thứ hai.
2. Migration thứ hai giữ nguyên bảng cũ, thêm bảng nội bộ `project_sections`, `project_canvas_nodes`, `project_canvas_links`, `project_events`, lời mời, lời nhắn, bucket ảnh dự án riêng tư và bucket Feed công khai.
3. `project_showcases` là view chỉ trả về các trường công khai được chọn. Bảng `projects` chứa trường nội bộ; RLS chỉ cho chủ dự án, thành viên và nhân sự được phép đọc nguyên hàng. Canvas và ảnh dự án riêng tư chỉ cho thành viên được cấp quyền xem; người chỉnh sửa có thể ghi. Chỉ chủ dự án được công bố snapshot.
4. Chạy migration và kiểm tra quyền truy cập trước khi triển khai tính năng cloud trong nhánh này. Bản đang chạy vẫn cho phép chỉnh sửa dự án **chỉ trên thiết bị** mà không cần migration; nếu triển khai nhánh này quá sớm, các trang dự án cloud sẽ báo thiếu bảng/view.

## Đăng nhập và địa chỉ web

Site dùng miễn phí GitHub Pages ở `https://labmourstudio.github.io/Mora/` **sau khi repository được đổi tên thành `Mora` và workflow triển khai thành công**. Trước khi đổi tên, trong Supabase **Authentication → URL Configuration**:

- Thêm Redirect URL `https://labmourstudio.github.io/Mora/**`.
- Đổi Site URL thành `https://labmourstudio.github.io/Mora/` sau khi Mora đã hoạt động.
- Giữ Redirect URL `/Marea/**` trong giai đoạn chuyển tiếp để các email cũ tiếp tục mở được.

Workflow `.github/workflows/deploy-pages.yml` dùng `GITHUB_REPOSITORY` để đặt base path đúng với tên repo. Trong GitHub Actions, giữ hai secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Đường dẫn sâu được hỗ trợ bằng `404.html` cho SPA. Không cần Vercel, dịch vụ trả phí, domain riêng hoặc dữ liệu giả để chạy bản này.

## Quy trình dự án

- Feed chỉ tạo bài đăng. Dự án được tạo tại `/studio/projects` với hai lựa chọn: chỉ trên thiết bị hoặc riêng tư trên Supabase.
- Bản chỉ trên thiết bị dùng IndexedDB, tự lưu, có xuất và nhập bản sao lưu JSON. Xóa dữ liệu trình duyệt có thể làm mất bản không sao lưu. Muốn mời người khác, chủ dự án xác nhận tải toàn bộ bản nháp lên Supabase trước.
- Dự án cloud có mục nội dung linh hoạt, canvas nhân vật/vùng đất, ảnh riêng tư, sự kiện/phác thảo. Chủ dự án tạo liên kết mời một lần cho người xem hoặc người chỉnh sửa, hết hạn sau bảy ngày.
- Khi công bố, chủ dự án đánh dấu từng mục sẽ đưa vào snapshot công khai. Ảnh được chọn mới sao chép sang bucket công khai. Người xem liên hệ qua lời nhắn trong Mora: hợp tác, trao đổi chuyên môn hoặc đề nghị đầu tư; không có giao dịch đầu tư.
- Chọn nội dung rồi dùng **In / lưu PDF 16:9** để mở hộp thoại in của trình duyệt và chọn **Save as PDF**. Bản xuất chứa mô tả, ảnh và liên kết của các mục đã chọn.

## Giới hạn và vận hành

- Quyền xem, chỉnh sửa và tải ảnh riêng tư được kiểm tra bằng RLS/Storage. Tùy chọn hạn chế sao chép hay xuất trên giao diện không thể ngăn người đã xem lưu tài nguyên hoặc chụp màn hình.
- Bản nháp chỉ trên thiết bị không được mã hóa riêng; bảo vệ thiết bị và file JSON sao lưu như tài liệu riêng tư. File JSON có thể chứa ảnh dưới dạng dữ liệu nhúng.
- Kiểm tra nhãn hiệu, tên miền và tài khoản mạng xã hội **Mora** trước khi công bố thương mại. Việc đổi tên repository không xác lập quyền đối với tên thương hiệu.
- Quản trị cần MFA/passkey, xác minh lại thay đổi quan trọng, vòng đời phiên và chính sách sao lưu tại Supabase trước khi vận hành rộng. Xem `docs/SECURITY_AND_BACKEND.md`.
